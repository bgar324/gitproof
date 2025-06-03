import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getAiSummary } from "@/lib/gemini";
import { Octokit } from "@octokit/rest";
import {
  getDetailedRepoMetrics,
  aggregateLanguagesByYear,
} from "@/lib/github-metrics";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { repos, createdAt } = await request.json();
    const octokit = new Octokit({ auth: session.accessToken });

    // Calculate years on GitHub
    const joinDate = new Date(createdAt);
    const currentDate = new Date();
    const yearsOnGitHub = currentDate.getFullYear() - joinDate.getFullYear();

    // Get detailed metrics for each repository
    const repoMetricsPromises = repos.map((repo: any) =>
      getDetailedRepoMetrics(octokit, repo.owner.login, repo.name)
    );

    const repoDetails = await Promise.all(repoMetricsPromises);
    const yearlyLanguages = aggregateLanguagesByYear(repoDetails);

    // Calculate aggregate metrics
    const totalRepos = repoDetails.length;
    const multiContributorRepos = repoDetails.filter(
      (r) => r.collaboration_metrics.total_contributors > 1
    ).length;
    const totalCommits = repoDetails.reduce(
      (sum, r) => sum + r.commit_metrics.total_commits,
      0
    );
    const longestStreak = Math.max(
      ...repoDetails.map((r) => r.commit_metrics.longest_streak_days)
    );
    const totalPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.total_prs,
      0
    );
    const mergedPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.merged_prs,
      0
    );
    const reposWithTests = repoDetails.filter(
      (r) => r.code_quality.has_tests
    ).length;
    const reposWithCI = repoDetails.filter((r) => r.code_quality.has_ci).length;

    // Find most significant repositories based on metrics
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
          (repo.readme_metrics.word_count > 300 ? 5 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Calculate documentation quality metrics
    const reposWithReadme = repoDetails.filter(
      (r) => r.readme_metrics !== null
    ).length;
    const avgReadmeScore =
      repoDetails.reduce(
        (sum, r) => sum + (r.readme_metrics?.overall_score || 0),
        0
      ) / repoDetails.length;

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
      api_docs: repoDetails.filter(
        (r) => r.readme_metrics?.quality_signals.has_api_docs
      ).length,
      examples: repoDetails.filter(
        (r) => r.readme_metrics?.quality_signals.has_examples
      ).length,
    };

    // Construct the prompt for AI analysis
    const prompt = `
      Generate a professional, recruiter-facing profile summary based on these verified GitHub metrics. Use third-person, neutral language. Focus on providing a clear snapshot of technical skills, progression, and project highlights.

      Profile Overview:
      - Years on GitHub: ${yearsOnGitHub}
      - Total Repositories: ${totalRepos}
      - Multi-contributor Repos: ${multiContributorRepos}
      - Total Commits: ${totalCommits}
      - Longest Commit Streak: ${longestStreak} days
      - Total PRs: ${totalPRs} (${mergedPRs} merged)
      - Repos with Tests: ${reposWithTests}
      - Repos with CI: ${reposWithCI}

      Top 3 Most Significant Repositories:
      ${significantRepos
        .map(
          (repo) => `
        ${repo.name}:
        - Description: ${repo.description}
        - Stars: ${repo.stars}
        - Forks: ${repo.forks}
        - Contributors: ${repo.collaboration_metrics.total_contributors}
        - Documentation Score: ${
          repo.readme_metrics?.overall_score.toFixed(1) || "N/A"
        }/100
        - Documentation Highlights: ${[
          repo.readme_metrics?.critical_sections.installation
            ? "Setup Guide"
            : "",
          repo.readme_metrics?.critical_sections.usage ? "Usage Docs" : "",
          repo.readme_metrics?.critical_sections.architecture
            ? "Architecture"
            : "",
          repo.readme_metrics?.quality_signals.has_api_docs ? "API Docs" : "",
          repo.readme_metrics?.quality_signals.has_examples ? "Examples" : "",
        ]
          .filter(Boolean)
          .join(", ")}
        - README Preview: """${repo.readme_metrics?.content?.substring(0, 1000) || 'No README content available'}"""
      `
        )
        .join("")}

      Documentation Quality Analysis:
      - Overall Documentation Score: ${avgReadmeScore.toFixed(1)}/100
      - Repositories with Documentation: ${reposWithReadme}/${totalRepos}
      - Documentation Completeness:
        * Installation Guides: ${readmeQualityBreakdown.installation} repos
        * Usage Documentation: ${readmeQualityBreakdown.usage} repos
        * Contribution Guidelines: ${readmeQualityBreakdown.contribution} repos
        * API Documentation: ${readmeQualityBreakdown.api_docs} repos
        * Code Examples: ${readmeQualityBreakdown.examples} repos

      Technology Evolution:
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

      Provide a comprehensive profile summary that includes:
      1. Technical expertise and progression based on the yearly language evolution
      2. Project highlights and complexity, focusing on the top 3 repositories
      3. Collaboration patterns and contributions (PRs, multi-contributor repos)
      4. Documentation quality assessment using the provided metrics
      5. Professional development indicators (testing, CI, modern practices)

      Be specific about documentation practices - if the score is low (below 60), note it as an area for improvement. If high (above 80), highlight it as a strength.

      Output in a neutral, third-person style suitable for a professional profile. Focus on concrete metrics and observable patterns.
    `;

    const analysis = await getAiSummary(
      prompt,
      `recruiter-${session.user?.name || "anonymous"}`
    );
    return new NextResponse(JSON.stringify({ analysis }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in recruiter analysis:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
