// File: pages/api/ai/pdf-summary.ts

import { NextResponse } from "next/server";
import { getAiSummary } from "@/lib/gemini";
import { getDetailedRepoMetrics, aggregateLanguagesByYear } from "@/lib/github-metrics";
import { Octokit } from "@octokit/rest";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import type { GitHubRepo } from "@/types/github";

//
// ──────────────────────────────────────────────────────────────────────────────
//  Module‐level in‐memory cache: maps a unique key to its generated summary.
//  Key format: "<name>::<createdAt>::<sorted_owner/repo|owner/repo|...>"
//
const summaryCache = new Map<string, string>();

export async function POST(request: Request) {
  // 1) Authenticate
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 2) Parse and validate request body
    const { repos, createdAt, name } = await request.json();
    if (!Array.isArray(repos)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid repos data: expected an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (typeof createdAt !== "string" || !createdAt) {
      return new NextResponse(
        JSON.stringify({ error: "Missing or invalid createdAt" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (typeof name !== "string" || !name) {
      return new NextResponse(
        JSON.stringify({ error: "Missing or invalid name" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3) Build a stable cache key
    //    Sort the repos by "owner/name" so that order does not matter.
    const sortedRepoKeys = (repos as GitHubRepo[])
      .map((r) => `${r.owner.login}/${r.name}`)
      .sort()
      .join("|");
    const cacheKey = `${name}::${createdAt}::${sortedRepoKeys}`;

    // 4) If a summary already exists for this key, return it immediately
    if (summaryCache.has(cacheKey)) {
      const cachedSummary = summaryCache.get(cacheKey)!;
      return NextResponse.json({ summary: cachedSummary, cached: true });
    }

    // 5) Otherwise, compute metrics for each repo
    const octokit = new Octokit({ auth: session.accessToken });
    const repoMetricsPromises = (repos as GitHubRepo[]).map((repo) =>
      getDetailedRepoMetrics(octokit, repo.owner.login, repo.name)
    );
    const repoDetails = await Promise.all(repoMetricsPromises);

    // 6) Calculate years on GitHub from the provided createdAt (join date)
    const joinDate = new Date(createdAt);
    const currentDate = new Date();
    const yearsOnGitHub = currentDate.getFullYear() - joinDate.getFullYear();

    // 7) Sort repositories by stars
    const sortedRepos = [...repoDetails].sort((a, b) => b.stars - a.stars);

    // 8) Aggregate languages by year
    const yearlyLanguages = aggregateLanguagesByYear(repoDetails);

    // 9) Gather summary statistics
    const totalRepos = repoDetails.length;
    const multiContributorRepos = repoDetails.filter(
      (r) => r.collaboration_metrics.total_contributors > 1
    ).length;
    const totalCommits = repoDetails.reduce(
      (sum, r) => sum + r.commit_metrics.total_commits,
      0
    );
    const totalPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.total_prs,
      0
    );
    const mergedPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.merged_prs,
      0
    );
    const reposWithTests = repoDetails.filter((r) => r.code_quality.has_tests).length;
    const reposWithCI = repoDetails.filter((r) => r.code_quality.has_ci).length;

    // 10) Build the LLM prompt string
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
`;

    // 11) Call Gemini (via getAiSummary) to generate the summary
    const summary = await getAiSummary(prompt, "pdf-summary");

    // 12) Cache the generated summary under our cacheKey
    summaryCache.set(cacheKey, summary);

    // 13) Return the newly generated summary (cached: false)
    return NextResponse.json({ summary, cached: false });
  } catch (error: any) {
    console.error("Error in /api/ai/pdf-summary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
