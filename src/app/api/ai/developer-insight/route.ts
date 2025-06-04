import { NextResponse } from "next/server"
import { getAiSummary } from "@/lib/gemini"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { Octokit } from "@octokit/rest"
import {
  getDetailedRepoMetrics,
  aggregateLanguagesByYear,
} from "@/lib/github-metrics"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const { repos, createdAt } = await request.json()
    const octokit = new Octokit({ auth: session.accessToken })

    const joinDate = new Date(createdAt)
    const currentDate = new Date()
    const yearsOnGitHub = currentDate.getFullYear() - joinDate.getFullYear()

    const repoMetricsPromises = repos.map((repo: any) =>
      getDetailedRepoMetrics(octokit, repo.owner.login, repo.name)
    )
    const repoDetails = await Promise.all(repoMetricsPromises)
    const yearlyLanguages = aggregateLanguagesByYear(repoDetails)

    const totalRepos = repoDetails.length
    const multiContributorRepos = repoDetails.filter(
      (r) => r.collaboration_metrics.total_contributors > 1
    ).length
    const totalCommits = repoDetails.reduce(
      (sum, r) => sum + r.commit_metrics.total_commits,
      0
    )
    const longestStreak = Math.max(
      ...repoDetails.map((r) => r.commit_metrics.longest_streak_days)
    )
    const totalPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.total_prs,
      0
    )
    const mergedPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.merged_prs,
      0
    )
    const reposWithTests = repoDetails.filter((r) => r.code_quality.has_tests)
      .length
    const reposWithCI = repoDetails.filter((r) => r.code_quality.has_ci).length
    const reposWithReadme = repoDetails.filter((r) => r.readme_metrics).length
    const avgReadmeScore =
      repoDetails.reduce(
        (sum, r) => sum + (r.readme_metrics?.overall_score || 0),
        0
      ) / totalRepos

    const significantRepos = repoDetails
      .map((repo) => ({
        ...repo,
        score:
          repo.stars * 2 +
          repo.forks * 3 +
          repo.commit_metrics.total_commits * 0.1 +
          repo.collaboration_metrics.total_contributors * 5 +
          (repo.code_quality.has_tests ? 10 : 0) +
          (repo.code_quality.has_ci ? 10 : 0) +
          (repo.readme_metrics?.overall_score > 80 ? 10 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    const readmeQualityBreakdown = {
      installation: repoDetails.filter(
        (r) => r.readme_metrics?.critical_sections.installation
      ).length,
      usage: repoDetails.filter(
        (r) => r.readme_metrics?.critical_sections.usage
      ).length,
      contribution: repoDetails.filter(
        (r) => r.readme_metrics?.critical_sections.contribution
      ).length,
      license: repoDetails.filter(
        (r) => r.readme_metrics?.critical_sections.license
      ).length,
      architecture: repoDetails.filter(
        (r) => r.readme_metrics?.critical_sections.architecture
      ).length,
      api_docs: repoDetails.filter(
        (r) => r.readme_metrics?.quality_signals.has_api_docs
      ).length,
      examples: repoDetails.filter(
        (r) => r.readme_metrics?.quality_signals.has_examples
      ).length,
      troubleshooting: repoDetails.filter(
        (r) => r.readme_metrics?.quality_signals.has_troubleshooting
      ).length,
    }

    const techStackSummary = Array.from(
      new Set(repoDetails.flatMap((r) => r.tech_stack.frameworks))
    )

    const prompt = `
You are GitProof, an expert developer reviewer that combines AI analysis. You analyze developer GitHub profiles with the sole intent of surfacing blind spots, missing best practices, or critical growth opportunities—not just restating what a developer is already doing well. Use a third-person and collective 'we' voice (as "GitProof").

Given the following structured GitHub profile data, prioritize feedback as follows:

Primary focus (at least 50% of response):

- What the developer is lacking, missing, or neglecting compared to modern industry standards, top candidates, or the stated best practices.
- Specific technical and professional skills that are notably absent or underdeveloped.
- Any worrying patterns, bottlenecks, or points of stagnation (e.g. no tests, no CI/CD, never works in teams, documentation always missing, not enough maintenance, few public commits, always same stack, lack of major feature delivery, no major user impact, only personal projects, etc).

Secondary focus (around 30% of response):

- A concise summary of what the developer is already doing well or above average (skills, habits, or patterns that are a real asset).
- Avoid generic praise, avoid overexplaining obvious strengths, only mention the most distinctive positives.

Actionable Next Steps (around 20% of response):

- Give 3–5 high-impact, specific, and achievable actions the developer should take immediately to address their key weaknesses.
- Actions should be concrete (e.g., “add Jest tests and require coverage for PRs in X repo,” “deploy a real project with CI/CD,” “contribute a PR to an open-source repo,” “document a project for non-devs,” “add analytics to logit-v2,” “add localized code comments,” etc), not generic advice.

Closing:

- End with a brief, direct statement. Reinforce that honest, tough feedback is the fastest way to reach the next level, and that "we" (GitProof) are invested in their progress.

Use the following structured input:

## Profile Overview
- Years on GitHub: ${yearsOnGitHub}
- Total Repositories: ${totalRepos}
- Multi-contributor Repos: ${multiContributorRepos}
- Total Commits: ${totalCommits}
- Longest Commit Streak: ${longestStreak} days
- Total PRs: ${totalPRs} (${mergedPRs} merged)
- Repos with Tests: ${reposWithTests}
- Repos with CI: ${reposWithCI}
- Repos with README: ${reposWithReadme}
- Average README Score: ${avgReadmeScore.toFixed(1)}/100
- Dominant Frameworks Across Projects: ${techStackSummary.join(", ") || "None"}

## Documentation Quality Breakdown
- Installation Guides: ${readmeQualityBreakdown.installation} repos
- Usage Documentation: ${readmeQualityBreakdown.usage} repos
- Contribution Guidelines: ${readmeQualityBreakdown.contribution} repos
- License Details: ${readmeQualityBreakdown.license} repos
- Architecture Overviews: ${readmeQualityBreakdown.architecture} repos
- API Documentation: ${readmeQualityBreakdown.api_docs} repos
- Code Examples: ${readmeQualityBreakdown.examples} repos
- Troubleshooting Sections: ${readmeQualityBreakdown.troubleshooting} repos

## Yearly Language Distribution
${Object.entries(yearlyLanguages)
  .sort(([a], [b]) => Number(b) - Number(a))
  .map(
    ([year, langs]) =>
      `${year}: ${Object.entries(langs)
        .sort(([, a], [, b]) => b - a)
        .map(([lang, count]) => `${lang} (${count})`)
        .join(", ")}`
  )
  .join("\n")}

## Top 3 Most Significant Repositories
${significantRepos
  .map(
    (repo) => `
- ${repo.name}:
  * Description: ${repo.description}
  * Language: ${repo.language || "None"}
  * Created: ${new Date(repo.created_at).toLocaleDateString()}
  * Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}
  * Stars: ${repo.stars}
  * Forks: ${repo.forks}
  * Contributors: ${repo.collaboration_metrics.total_contributors}
  * Total Issues: ${repo.collaboration_metrics.total_issues}
  * Open Issues: ${repo.collaboration_metrics.open_issues}
  * Closed Issues: ${repo.collaboration_metrics.closed_issues}
  * Total PRs: ${repo.collaboration_metrics.total_prs}
  * Merged PRs: ${repo.collaboration_metrics.merged_prs}
  * Has Tests: ${repo.code_quality.has_tests}
  * Has CI: ${repo.code_quality.has_ci}
  * Dependency Count: ${repo.code_quality.dependency_count}
  * Dev Dependency Count: ${repo.code_quality.dev_dependency_count}
  * Frameworks: ${repo.tech_stack.frameworks.join(", ") || "None"}
  * Major Libraries: ${repo.tech_stack.major_libraries.join(", ") || "None"}
  * Dev Tools: ${repo.tech_stack.dev_tools.join(", ") || "None"}
  * Total Commits: ${repo.commit_metrics.total_commits}
  * First Commit: ${repo.commit_metrics.first_commit_date}
  * Last Commit: ${repo.commit_metrics.last_commit_date}
  * Unique Days with Commits: ${repo.commit_metrics.commit_stats.unique_days_with_commits}
  * Weekly Commit Stats (last 52 weeks): ${repo.commit_metrics.commit_stats.weekly.join(", ")}
  * Longest Commit Streak: ${repo.commit_metrics.longest_streak_days} days
  * README Quality Score: ${repo.readme_metrics?.overall_score.toFixed(1) || "N/A"}/100
  * README Preview: """${repo.readme_metrics?.content || "Not available"}"""
`
  )
  .join("")}

## Detailed Repository Information (All Repos)
${repoDetails
  .map(
    (repo) => `
- ${repo.name}:
  * Language: ${repo.language || "None"}
  * Stars: ${repo.stars}
  * Forks: ${repo.forks}
  * Size: ${repo.size}KB
  * Has Tests: ${repo.code_quality.has_tests}
  * Has CI: ${repo.code_quality.has_ci}
  * Total Commits: ${repo.commit_metrics.total_commits}
  * Longest Streak: ${repo.commit_metrics.longest_streak_days} days
  * Total Contributors: ${repo.collaboration_metrics.total_contributors}
  * Open Issues: ${repo.collaboration_metrics.open_issues}
  * Repos Topics: ${repo.topics.join(", ") || "None"}
`
  )
  .join("")}

Return your response in markdown.
Use:
- Headings (## Section Name)
- Bullet points for actionable items
- Paragraphs separated by double newlines
`

    const analysis = await getAiSummary(
      prompt,
      `developer-insight-${session.user?.name || "anonymous"}`
    )
    return new NextResponse(JSON.stringify({ analysis }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("Error in AI analysis:", error)
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}