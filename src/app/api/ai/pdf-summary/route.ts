import { NextResponse } from "next/server"
import { getAiSummary } from "@/lib/gemini"
import { getDetailedRepoMetrics, aggregateLanguagesByYear } from "@/lib/github-metrics"
import { Octokit } from "@octokit/rest"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { GitHubRepo } from "@/types/github"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const { repos, createdAt, name } = await request.json()

    if (!Array.isArray(repos)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid repos data: expected an array' }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const octokit = new Octokit({ auth: session.accessToken })
    const repoMetricsPromises = repos.map((repo: any) =>
      getDetailedRepoMetrics(octokit, repo.owner.login, repo.name)
    )
    const repoDetails = await Promise.all(repoMetricsPromises)

    // Calculate years on GitHub
    const joinDate = new Date(createdAt)
    const currentDate = new Date()
    const yearsOnGitHub = currentDate.getFullYear() - joinDate.getFullYear()

    // Sort repositories by stars
    const sortedRepos = [...repoDetails].sort(
      (a, b) => b.stars - a.stars
    )

    const yearlyLanguages = aggregateLanguagesByYear(repoDetails)

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

    const prompt = `
Write a recruiter-facing, glowing 2-3 sentence summary for this developer, focusing only on technical strengths, breadth of work, and notable skills or accomplishments. Never mention negatives or lack. Frame all metrics and highlights in a maximally positive light.

Profile Overview:
- Years on GitHub: ${yearsOnGitHub}
- Total Public Repositories: ${totalRepos}
- Collaborative Projects: ${multiContributorRepos}
- Total Commits: ${totalCommits}
- Pull Requests: ${totalPRs} (${mergedPRs} merged)
- Projects with Automated Tests: ${reposWithTests}
- Projects with CI: ${reposWithCI}

Yearly Language Distribution:
${Object.entries(yearlyLanguages)
  .map(
    ([year, langs]) =>
      `${year}: ${Object.entries(langs)
        .map(([lang, count]) => `${lang} (${count})`)
        .join(", ")}`
  )
  .join("\n")}

Top Projects:
${sortedRepos
  .slice(0, 3)
  .map(
    (repo) => `
${repo.name} (${repo.language || "Unknown"}): ${repo.description || "No description"}
- ⭐ ${repo.stars} | Forks: ${repo.forks}
- Contributors: ${repo.collaboration_metrics.total_contributors}
- Automated Tests: ${repo.code_quality.has_tests ? "Yes" : "No"}
- CI: ${repo.code_quality.has_ci ? "Yes" : "No"}`
  )
  .join("\n")}

Write exactly 2-3 concise, positive, professional sentences, as if you were a recruiter highlighting only this developer's strengths.
`

    const summary = await getAiSummary(prompt, "pdf-summary")

    return NextResponse.json({ summary })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
