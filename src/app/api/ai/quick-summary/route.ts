import { NextResponse } from "next/server"
import { getAiSummary } from "@/lib/gemini"
import { getDetailedRepoMetrics, aggregateLanguagesByYear } from "@/lib/github-metrics"
import { Octokit } from "@octokit/rest"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { GitHubRepo } from "@/types/github"

interface QuickSummaryRepoLight extends Omit<GitHubRepo, "has_tests" | "has_ci" | "pr_count"> {
  // These fields will be replaced by the richer metrics from getDetailedRepoMetrics
  has_tests: boolean
  has_ci: boolean
  pr_count: number
  commit_count: number
  stargazers_count: number
  language: string | null
  description: string | null
  forks_count: number
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { repos, createdAt } = await request.json()

    // Calculate years on GitHub
    const joinDate = new Date(createdAt)
    const currentDate = new Date()
    const yearsOnGitHub = currentDate.getFullYear() - joinDate.getFullYear()

    // Ensure repos is an array
    if (!Array.isArray(repos)) {
      throw new Error("Invalid repos data: expected an array")
    }
    const typedRepos = repos as QuickSummaryRepoLight[]

    // Fetch detailed metrics for each repository
    const octokit = new Octokit({ auth: session.accessToken })
    const repoMetricsPromises = typedRepos.map((repo) =>
      getDetailedRepoMetrics(octokit, repo.owner.login, repo.name)
    )
    const repoDetails = await Promise.all(repoMetricsPromises)

    // Combine with basic fields for sorting
    const enrichedRepos = repoDetails.map((d) => ({
      name: d.name,
      description: d.description,
      stargazers_count: d.stars,
      forks_count: d.forks,
      language: d.language,
      collaboration_metrics: d.collaboration_metrics,
      commit_metrics: d.commit_metrics,
      code_quality: d.code_quality,
      readme_metrics: d.readme_metrics,
    }))

    // Sort repositories by stars to highlight the most significant ones
    const sortedRepos = [...enrichedRepos].sort(
      (a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)
    )

    // Get language evolution data
    const yearlyLanguages = aggregateLanguagesByYear(repoDetails)

    // Calculate aggregate metrics
    const totalRepos = repoDetails.length
    const multiContributorRepos = repoDetails.filter(
      (r) => r.collaboration_metrics.total_contributors > 1
    ).length
    const totalCommits = repoDetails.reduce(
      (sum, r) => sum + r.commit_metrics.total_commits,
      0
    )
    const totalPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.total_prs,
      0
    )
    const mergedPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.merged_prs,
      0
    )
    const reposWithTests = repoDetails.filter((r) => r.code_quality.has_tests).length
    const reposWithCI = repoDetails.filter((r) => r.code_quality.has_ci).length

    // Construct a focused prompt for quick summary (unchanged)
    const prompt = `
    Summarize this developer's GitHub profile in 2-3 sentences for a technical recruiter, focusing on technical growth, main skills, and real proof of ability. Use only verifiable facts from the data.
    
    Profile Overview:
    - Years on GitHub: ${yearsOnGitHub}
    - Total Repositories: ${totalRepos}
    - Multi-contributor Repos: ${multiContributorRepos}
    - Total Commits: ${totalCommits}
    - Total PRs: ${totalPRs} (${mergedPRs} merged)
    - Repos with Tests: ${reposWithTests}
    - Repos with CI: ${reposWithCI}

    Yearly Language Evolution:
    ${Object.entries(yearlyLanguages)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(
        ([year, langs]) =>
          `${year}: ${Object.entries(langs)
            .sort(([, a], [, b]) => b - a)
            .map(([lang]) => lang)
            .join(", ")}`
      )
      .join("\n")}

    Top Repositories:
    ${sortedRepos
      .slice(0, 5) // Limit to top 5 repos to keep the prompt concise
      .map(
        (repo) => `
    ${repo.name}:
    - Description: ${repo.description || "No description"}
    - Stars: ${repo.stargazers_count || 0}
    - Forks: ${repo.forks_count || 0}
    - Primary Language: ${repo.language || "Not specified"}
    - Contributors: ${repo.collaboration_metrics?.total_contributors || 1}
    - Has Tests: ${repo.code_quality?.has_tests ? "Yes" : "No"}
    - Has CI: ${repo.code_quality?.has_ci ? "Yes" : "No"}
    - Documentation Score: ${
      repo.readme_metrics?.overall_score?.toFixed(1) || "N/A"
    }/100
    - README Preview: """${
      repo.readme_metrics?.content?.substring(0, 1000) ||
      "No README content available"
    }"""
    `
      )
      .join("\n")}

    Instructions:
    - Provide a concise 2-3 sentence summary of the developer's profile
    - Focus on their technical growth, main skills, and verifiable achievements
    - Mention any notable projects or contributions
    - Keep it professional and factual, suitable for a recruiter
    - Do not exceed 3 sentences
    `

    const summary = await getAiSummary(prompt, "quick-summary")

    return NextResponse.json({
      summary,
      metrics: {
        totalRepos,
        multiContributorRepos,
        totalCommits,
        yearsOnGitHub,
        totalPRs,
        mergedPRs,
        reposWithTests,
        reposWithCI,
      },
    })
  } catch (error: any) {
    console.error("Error in quick summary:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
