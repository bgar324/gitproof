import { NextResponse } from "next/server";
import { getAiSummary } from "@/lib/gemini";
import { aggregateLanguagesByYear } from "@/lib/github-metrics";
import { GitHubRepo } from "@/app/types/github";

interface QuickSummaryRepo extends Omit<GitHubRepo, 'has_tests' | 'has_ci' | 'pr_count'> {
  has_tests: boolean;
  has_ci: boolean;
  pr_count: number;
  commit_count: number;
  stargazers_count: number;
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
      throw new Error('Invalid repos data: expected an array');
    }
    
    // Type assertion for the repos array
    const typedRepos = repos as QuickSummaryRepo[];

    // Get language evolution data
    const yearlyLanguages = aggregateLanguagesByYear(repos);

    // Construct a focused prompt for quick summary
    const prompt = `
    Summarize this developer's GitHub profile in 2-3 sentences for a technical recruiter, focusing on technical growth, main skills, and real proof of ability. Use only verifiable facts from the data.
    
    Profile Overview:
    - Years on GitHub: ${yearsOnGitHub}
    - Total Repositories: ${repos.length}
    - Longest Commit Streak: ${Math.max(...typedRepos.map((r: QuickSummaryRepo) => r.commit_count || 0))} days
    - PRs (Pull Requests): ${typedRepos.reduce((sum: number, r: QuickSummaryRepo) => sum + (r.pr_count || 0), 0)}
    - Repos with Tests: ${typedRepos.filter((r: QuickSummaryRepo) => r.has_tests).length}
    - Repos with CI: ${typedRepos.filter((r: QuickSummaryRepo) => r.has_ci).length}
    - Stars (most popular repo): ${Math.max(...typedRepos.map((r: QuickSummaryRepo) => r.stargazers_count || 0))}
    - Primary Languages:
    ${Object.entries(yearlyLanguages)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(
        ([year, langs]) =>
          `${year}: ${Object.entries(langs)
            .sort(([, a], [, b]) => b - a)
            .map(([lang]) => lang)
            .slice(0, 3)
            .join(", ")}`
      )
      .join("\n")}
    
    Instructions:
    - Identify the developer's experience level by GitHub activity and project signals.
    - Briefly describe their technical journey (e.g., "Started with Python, now focused on React/TypeScript full-stack").
    - If there are any critical omissions (no CI/CD, no tests), mention this as a potential next step.
    - End with a direct assessment of current expertise level (e.g. “entry-level frontend developer,” “early-career full-stack developer with a focus on TypeScript and Next.js,” etc.)
    - Do not use generic praise. Limit to 50 words.
    `;
    
    const summary = await getAiSummary(prompt, "quick-summary");
    
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Error in quick summary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
