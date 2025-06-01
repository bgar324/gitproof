import { NextResponse } from 'next/server'
import { getAiSummary } from '@/lib/gemini'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { Octokit } from '@octokit/rest'
import { getDetailedRepoMetrics, aggregateLanguagesByYear } from '@/lib/github-metrics'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return new Response('Unauthorized', { status: 401 })
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
      r => r.collaboration_metrics.total_contributors > 1
    ).length;
    const totalCommits = repoDetails.reduce(
      (sum, r) => sum + r.commit_metrics.total_commits, 0
    );
    const longestStreak = Math.max(
      ...repoDetails.map(r => r.commit_metrics.longest_streak_days)
    );
    const totalPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.total_prs, 0
    );
    const mergedPRs = repoDetails.reduce(
      (sum, r) => sum + r.collaboration_metrics.merged_prs, 0
    );
    const reposWithTests = repoDetails.filter(
      r => r.code_quality.has_tests
    ).length;
    const reposWithCI = repoDetails.filter(
      r => r.code_quality.has_ci
    ).length;

    const prompt = `Analyze this GitHub profile data and provide a detailed, developer-focused summary with actionable insights. Use a supportive, growth-oriented tone while maintaining factual observations. Here are the verified metrics:

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
  .map(([year, langs]) =>
    `${year}: ${Object.entries(langs)
      .map(([lang, count]) => `${lang} (${count})`)
      .join(', ')}`
  )
  .join('\n')}

Detailed Repository Information:
${repoDetails.map((repo: {
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
  * Language: ${repo.language || 'None'}
  * Created: ${new Date(repo.created_at).toLocaleDateString()}
  * Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}
  * Stars: ${repo.stars}
  * Forks: ${repo.forks}
  * Size: ${repo.size}KB
  * Topics: ${repo.topics.join(', ') || 'None'}
  * Has README: ${repo.has_readme}
  * Commits: ${repo.commit_count}
  * Contributors: ${repo.contributors}
  * Is Fork: ${repo.is_fork}
  * Open Issues: ${repo.open_issues}
`).join('')}

Provide insights in these sections:

DEVELOPER JOURNEY
Analyze the progression of languages, frameworks, and project complexity over time. Highlight key learning patterns and technology adoption.

TECHNICAL STRENGTHS
Identify areas of expertise based on commit patterns, project complexity, and technology usage. Note any specializations or unique combinations of skills.

GROWTH OPPORTUNITIES
Suggest specific areas for skill development based on current trends in the repositories. Include concrete next steps or learning paths.

PROJECT RECOMMENDATIONS
Identify which repositories would benefit most from additional work. Suggest specific improvements for documentation, testing, or feature additions.

COLLABORATION PATTERNS
Analyze contribution habits, team interactions, and project management approaches. Suggest ways to enhance collaborative development practices.

Focus on being constructive and actionable. For each observation, provide clear evidence from the data and specific steps for improvement.`;

    const analysis = await getAiSummary(prompt, `profile-${session.user?.name || 'anonymous'}`)
    return new NextResponse(JSON.stringify({ analysis }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error in AI analysis:', error)
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
