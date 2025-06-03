import { NextResponse } from "next/server";
import { getAiSummary } from "@/lib/gemini";
import { aggregateLanguagesByYear } from "@/lib/github-metrics";
import { GitHubRepo } from "@/types/github";

interface QuickSummaryRepo
  extends Omit<GitHubRepo, "has_tests" | "has_ci" | "pr_count"> {
  has_tests: boolean;
  has_ci: boolean;
  pr_count: number;
  commit_count: number;
  stargazers_count: number;
  language: string | null;
  description: string | null;
  forks_count: number;
  collaboration_metrics?: {
    total_contributors: number;
    total_prs: number;
    merged_prs: number;
  };
  commit_metrics?: {
    total_commits: number;
  };
  code_quality?: {
    has_tests: boolean;
    has_ci: boolean;
  };
  readme_metrics?: {
    content?: string;
    overall_score?: number;
  };
}

export async function POST(request: Request) {
  try {
    const { repos, createdAt } = await request.json();

    // Calculate years on GitHub
    const joinDate = new Date(createdAt);
    const currentDate = new Date();
    const yearsOnGitHub = currentDate.getFullYear() - joinDate.getFullYear();

    // Type guard to ensure repos is an array
    if (!Array.isArray(repos)) {
      throw new Error("Invalid repos data: expected an array");
    }

    // Type assertion for the repos array
    const typedRepos = repos as QuickSummaryRepo[];

    // Sort repositories by stars to highlight the most significant ones
    const sortedRepos = [...typedRepos].sort(
      (a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)
    );

    // Get language evolution data
    const yearlyLanguages = aggregateLanguagesByYear(repos);

    // Calculate aggregate metrics
    const totalRepos = typedRepos.length;
    const multiContributorRepos = typedRepos.filter(
      (r) => (r.collaboration_metrics?.total_contributors || 0) > 1
    ).length;
    const totalCommits = typedRepos.reduce(
      (sum, r) => sum + (r.commit_metrics?.total_commits || 0),
      0
    );
    const totalPRs = typedRepos.reduce(
      (sum, r) => sum + (r.collaboration_metrics?.total_prs || 0),
      0
    );
    const mergedPRs = typedRepos.reduce(
      (sum, r) => sum + (r.collaboration_metrics?.merged_prs || 0),
      0
    );
    const reposWithTests = typedRepos.filter(
      (r) => r.code_quality?.has_tests
    ).length;
    const reposWithCI = typedRepos.filter((r) => r.code_quality?.has_ci).length;

    // Construct a focused prompt for quick summary
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
    `;

    const summary = await getAiSummary(prompt, "quick-summary");

    return NextResponse.json({
      summary,
      metrics: {
        totalRepos,
        multiContributorRepos,
        totalCommits,
        yearsOnGitHub, // <-- Add this if calculated
        totalPRs,
        mergedPRs,
        reposWithTests,
        reposWithCI,
        // add any other metric you want to show
      },
    });
  } catch (error: any) {
    console.error("Error in quick summary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
