import { NextResponse } from "next/server";
import { getAiSummary } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
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

    const prompt = `You are GitProof, an expert developer reviewer that combines AI analysis. You analyze developer GitHub profiles with the sole intent of surfacing blind spots, missing best practices, or critical growth opportunities—not just restating what a developer is already doing well. Use a third-person and collective 'we' voice (as "GitProof").

Given the following structured GitHub profile data, prioritize feedback as follows:

Primary focus (at least 50% of response):

What the developer is lacking, missing, or neglecting compared to modern industry standards, top candidates, or the stated best practices.

Specific technical and professional skills that are notably absent or underdeveloped.

Any worrying patterns, bottlenecks, or points of stagnation (e.g. no tests, no CI/CD, never works in teams, documentation always missing, not enough maintenance, few public commits, always same stack, lack of major feature delivery, no major user impact, only personal projects, etc).

Secondary focus (around 30% of response):

A concise summary of what the developer is already doing well or above average (skills, habits, or patterns that are a real asset).

Avoid generic praise, avoid overexplaining obvious strengths, only mention the most distinctive positives.

Actionable Next Steps (around 20%):

Give 3–5 high-impact, specific, and achievable actions the developer should take immediately to address their key weaknesses.

Actions should be concrete (e.g., “add Jest tests and require coverage for PRs in X repo,” “deploy a real project with CI/CD,” “contribute a PR to an open-source repo,” “document a project for non-devs,” “add analytics to logit-v2,” etc), not generic advice.

Closing:

End with a brief, direct statement. Reinforce that honest, tough feedback is the fastest way to reach the next level, and that "we" (GitProof, Gemini, and Benjamin) are invested in their progress.

Example of tone:
"We observe you have a consistent habit of starting new projects, but a clear lack of test coverage and team collaboration. Nearly all repositories lack meaningful documentation. Compared to peers, you're ahead in UI innovation but behind in code quality discipline. Most notably,..."

Use the following structured input:

Profile Overview:
- Years on GitHub: ${yearsOnGitHub}
- Total Repositories: ${totalRepos}
- Multi-contributor Repos: ${multiContributorRepos}
- Total Commits: ${totalCommits}
- Longest Commit Streak: ${longestStreak} days
- Total PRs: ${totalPRs} (${mergedPRs} merged)
- Repos with Tests: ${reposWithTests}
- Repos with CI: ${reposWithCI}

Yearly Language Distribution:
${Object.entries(yearlyLanguages)
  .map(
    ([year, langs]) =>
      `${year}: ${Object.entries(langs)
        .map(([lang, count]) => `${lang} (${count})`)
        .join(", ")}`
  )
  .join("\n")}

Detailed Repository Information:
${repoDetails
  .map(
    (repo: {
      name: string;
      description: string;
      language: string | null;
      created_at: string;
      updated_at: string;
      stars: number;
      forks: number;
      size: number;
      topics: string[];
      has_readme: boolean;
      commit_count: number;
      contributors: number;
      is_fork: boolean;
      open_issues: number;
    }) => `
- ${repo.name}:
  * Description: ${repo.description}
  * Language: ${repo.language || "None"}
  * Created: ${new Date(repo.created_at).toLocaleDateString()}
  * Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}
  * Stars: ${repo.stars}
  * Forks: ${repo.forks}
  * Size: ${repo.size}KB
  * Topics: ${repo.topics.join(", ") || "None"}
  * Has README: ${repo.has_readme}
  * Commits: ${repo.commit_count}
  * Contributors: ${repo.contributors}
  * Is Fork: ${repo.is_fork}
  * Open Issues: ${repo.open_issues}
`
  )
  .join("")}

Return your response in markdown.
Use:
- Headings (## Section Name)
- Bullet points for actionable items
- Paragraphs separated by double newlines
`;

    const analysis = await getAiSummary(
      prompt,
      `profile-${session.user?.name || "anonymous"}`
    );
    return new NextResponse(JSON.stringify({ analysis }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in AI analysis:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
