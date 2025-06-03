import { NextResponse } from "next/server";
import { getAiSummary } from "@/lib/gemini";
import { aggregateLanguagesByYear } from "@/lib/github-metrics";
import { GitHubRepo } from "@/types/github";

export async function POST(request: Request) {
  try {
    const { repos, createdAt, name } = await request.json();

    if (!Array.isArray(repos)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid repos data: expected an array' }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Full metrics, all repos, just like developer-insight
    const joinDate = new Date(createdAt);
    const currentDate = new Date();
    const yearsOnGitHub = currentDate.getFullYear() - joinDate.getFullYear();

    const typedRepos = repos;
    const sortedRepos = [...typedRepos].sort(
      (a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)
    );
    const yearlyLanguages = aggregateLanguagesByYear(repos);

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

    // Glowing recruiter summary (pedestal mode)
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
${repo.name} (${repo.language || "Unknown"}): ${
      repo.description || "No description"
    }
- ⭐ ${repo.stargazers_count} | Forks: ${repo.forks_count}
- Contributors: ${repo.collaboration_metrics?.total_contributors || 1}
- Automated Tests: ${repo.code_quality?.has_tests ? "Yes" : "No"}
- CI: ${repo.code_quality?.has_ci ? "Yes" : "No"}`
  )
  .join("\n")}

Write exactly 2-3 concise, positive, professional sentences, as if you were a recruiter highlighting only this developer's strengths.
`;

    const summary = await getAiSummary(prompt, "pdf-summary");

    return NextResponse.json({ summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
