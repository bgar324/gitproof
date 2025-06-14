import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { checkPackageJsonExists } from './packageJsonCache';

type CommitResponse = RestEndpointMethodTypes['repos']['listCommits']['response']['data'][0];
type IssueResponse = RestEndpointMethodTypes['issues']['listForRepo']['response']['data'][0];
type PullResponse = RestEndpointMethodTypes['pulls']['list']['response']['data'][0];

interface ReadmeMetrics {
  word_count: number;
  content: string;
  sections: {
    name: string;
    content_length: number;
    has_code_examples: boolean;
  }[];
  critical_sections: {
    installation: boolean;
    usage: boolean;
    contribution: boolean;
    license: boolean;
    architecture: boolean;
  };
  formatting: {
    has_headers: boolean;
    has_code_blocks: boolean;
    has_lists: boolean;
    has_tables: boolean;
    has_images: boolean;
    has_badges: boolean;
  };
  quality_signals: {
    is_boilerplate: boolean;
    has_api_docs: boolean;
    has_env_setup: boolean;
    has_examples: boolean;
    has_troubleshooting: boolean;
  };
  overall_score: number; // 0-100
}

interface RepoMetrics {
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
  readme_metrics: ReadmeMetrics | null;
  commit_metrics: {
    total_commits: number;
    last_commit_date: string;
    longest_streak_days: number;
    commit_frequency: { [key: string]: number }; // Monthly frequency
  };
  collaboration_metrics: {
    total_contributors: number;
    total_issues: number;
    open_issues: number;
    closed_issues: number;
    total_prs: number;
    merged_prs: number;
    is_fork: boolean;
  };
  code_quality: {
    has_tests: boolean;
    test_directory_files: number;
    has_ci: boolean;
    has_linter: boolean;
    has_prettier: boolean;
    dependency_count: number;
    dev_dependency_count: number;
  };
  tech_stack: {
    frameworks: string[];
    major_libraries: string[];
    dev_tools: string[];
  };
}

interface YearlyLanguages {
  [year: string]: {
    [language: string]: number;
  };
}

export async function getDetailedRepoMetrics(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<RepoMetrics> {
  // Basic repo info
  const { data: repoData } = await octokit.repos.get({
    owner,
    repo,
  });

  // Get README content and analyze it
  const readmeMetrics = await analyzeReadme(octokit, owner, repo);

  // Get commit metrics
  const commitMetrics = await analyzeCommits(octokit, owner, repo);

  // Get collaboration metrics
  const collaborationMetrics = await analyzeCollaboration(octokit, owner, repo);

  // Analyze code quality signals
  const codeQuality = await analyzeCodeQuality(octokit, owner, repo);

  // Analyze tech stack
  const techStack = await analyzeTechStack(octokit, owner, repo);

  return {
    name: repoData.name,
    description: repoData.description || '',
    language: repoData.language,
    created_at: repoData.created_at,
    updated_at: repoData.updated_at,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    size: repoData.size,
    topics: repoData.topics || [],
    has_readme: readmeMetrics !== null,
    readme_metrics: readmeMetrics || {
      word_count: 0,
      content: '',
      sections: [],
      critical_sections: {
        installation: false,
        usage: false,
        contribution: false,
        license: false,
        architecture: false
      },
      formatting: {
        has_headers: false,
        has_code_blocks: false,
        has_lists: false,
        has_tables: false,
        has_images: false,
        has_badges: false
      },
      quality_signals: {
        is_boilerplate: false,
        has_api_docs: false,
        has_env_setup: false,
        has_examples: false,
        has_troubleshooting: false
      },
      overall_score: 0
    },
    commit_metrics: commitMetrics,
    collaboration_metrics: {
      total_contributors: collaborationMetrics.contributors,
      total_issues: collaborationMetrics.totalIssues,
      open_issues: repoData.open_issues_count,
      closed_issues: collaborationMetrics.closedIssues,
      total_prs: collaborationMetrics.totalPRs,
      merged_prs: collaborationMetrics.mergedPRs,
      is_fork: repoData.fork,
    },
    code_quality: await analyzeCodeQuality(octokit, owner, repo),
    tech_stack: techStack,
  };
}

async function analyzeReadme(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<ReadmeMetrics | null> {
  try {
    const { data } = await octokit.repos.getReadme({
      owner,
      repo,
    });

    const content = Buffer.from(data.content, 'base64').toString();
    const normalizedContent = content.toLowerCase();
    
    // Analyze sections
    const headerMatches = content.matchAll(/^(#{1,3})\s+(.+)$/gm);
    const sections = Array.from(headerMatches).map(match => {
      const sectionName = match[2].trim();
      const nextHeaderIndex = content.indexOf('#', match.index! + match[0].length);
      const sectionContent = nextHeaderIndex === -1 
        ? content.slice(match.index! + match[0].length)
        : content.slice(match.index! + match[0].length, nextHeaderIndex);
      
      return {
        name: sectionName,
        content_length: sectionContent.trim().length,
        has_code_examples: sectionContent.includes('```') || /^\s{4}/m.test(sectionContent)
      };
    });

    // Detect critical sections
    const criticalSections = {
      installation: hasSection(normalizedContent, ['installation', 'install', 'getting started', 'setup', 'quick start']),
      usage: hasSection(normalizedContent, ['usage', 'how to use', 'examples', 'api', 'documentation']),
      contribution: hasSection(normalizedContent, ['contributing', 'contribution', 'development', 'developers']),
      license: hasSection(normalizedContent, ['license', 'licensing', 'copyright']),
      architecture: hasSection(normalizedContent, ['architecture', 'design', 'structure', 'overview'])
    };

    // Analyze formatting
    const formatting = {
      has_headers: /^#{1,6}\s+/m.test(content),
      has_code_blocks: content.includes('```'),
      has_lists: /^[\s]*[-*+]\s/m.test(content),
      has_tables: /\|.*\|.*\|/m.test(content),
      has_images: content.includes('![') || content.includes('<img'),
      has_badges: (content.match(/!\[.*?\]\(.*?\)/g) || []).length > 0
    };

    // Check for quality signals
    const qualitySignals = {
      is_boilerplate: isBoilerplate(content),
      has_api_docs: hasAPIDocumentation(content),
      has_env_setup: hasEnvSetup(content),
      has_examples: hasCodeExamples(content),
      has_troubleshooting: hasTroubleshooting(content)
    };

    // Calculate overall score (0-100)
    const score = calculateReadmeScore({
      sections,
      criticalSections,
      formatting,
      qualitySignals,
      wordCount: content.split(/\s+/).length
    });

    return {
      word_count: content.split(/\s+/).length,
      content: content,
      sections,
      critical_sections: criticalSections,
      formatting,
      quality_signals: qualitySignals,
      overall_score: score
    };
  } catch {
    return null;
  }
}

export function hasSection(content: string, keywords: string[]): boolean {
  return keywords.some(keyword => 
    content.includes(`# ${keyword}`) ||
    content.includes(`## ${keyword}`) ||
    content.includes(`### ${keyword}`)
  );
}

function isBoilerplate(content: string): boolean {
  const boilerplateSignals = [
    'This project was bootstrapped with',
    'Getting Started with Create React App',
    'npm start',
    'yarn start',
    'Learn More'
  ];
  return boilerplateSignals.filter(signal => content.includes(signal)).length >= 3;
}

function hasAPIDocumentation(content: string): boolean {
  const apiSignals = [
    'api reference',
    'endpoints',
    'parameters',
    'response',
    'request',
    'authentication',
    'authorization'
  ];
  return apiSignals.some(signal => content.toLowerCase().includes(signal));
}

function hasEnvSetup(content: string): boolean {
  const envSignals = [
    '.env',
    'environment variables',
    'configuration',
    'prerequisites',
    'requirements'
  ];
  return envSignals.some(signal => content.toLowerCase().includes(signal));
}

function hasCodeExamples(content: string): boolean {
  return content.includes('```') || /^\s{4}/m.test(content);
}

function hasTroubleshooting(content: string): boolean {
  const troubleshootingSignals = [
    'troubleshoot',
    'debugging',
    'common issues',
    'known issues',
    'faq',
    'frequently asked questions'
  ];
  return troubleshootingSignals.some(signal => content.toLowerCase().includes(signal));
}

function calculateReadmeScore({
  sections,
  criticalSections,
  formatting,
  qualitySignals,
  wordCount
}: {
  sections: { content_length: number }[];
  criticalSections: { [key: string]: boolean };
  formatting: { [key: string]: boolean };
  qualitySignals: { [key: string]: boolean };
  wordCount: number;
}): number {
  let score = 0;

  // Base points for having content
  if (wordCount >= 100) score += 10;
  if (wordCount >= 300) score += 10;
  if (wordCount >= 500) score += 10;

  // Points for critical sections
  score += Object.values(criticalSections).filter(Boolean).length * 10;

  // Points for formatting
  score += Object.values(formatting).filter(Boolean).length * 5;

  // Points for quality signals
  const qualityPoints = Object.entries(qualitySignals).reduce((total, [key, value]) => {
    if (key === 'is_boilerplate' && value) return total - 20;
    return total + (value ? 5 : 0);
  }, 0);
  score += qualityPoints;

  // Normalize to 0-100 range
  return Math.max(0, Math.min(100, score));
}

async function analyzeCommits(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  // Get all commits across all branches
  const allCommits: CommitResponse[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 100, // Max allowed by GitHub API
      page,
    });

    if (commits.length === 0) {
      hasMore = false;
    } else {
      allCommits.push(...commits);
      // If we got less than 100 commits, we've reached the end
      if (commits.length < 100) {
        hasMore = false;
      }
      page++;
    }
  }


  // Sort commits by date (oldest first)
  const sortedCommits = [...allCommits].sort((a, b) => 
    new Date(a.commit.author?.date || 0).getTime() - new Date(b.commit.author?.date || 0).getTime()
  );

  // Calculate commit frequency by month
  const frequency: { [key: string]: number } = {};
  const commitDates: Date[] = [];
  
  sortedCommits.forEach((commit: CommitResponse) => {
    if (!commit.commit.author?.date) return;
    
    const date = new Date(commit.commit.author.date);
    commitDates.push(date);
    
    // Group by year-month for frequency
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    frequency[key] = (frequency[key] || 0) + 1;
  });

  // Calculate longest streak
  let longestStreak = 0;
  let currentStreak = 1;
  
  if (commitDates.length > 0) {
    // Sort unique dates
    const uniqueDates = Array.from(new Set(
      commitDates.map(d => d.toISOString().split('T')[0])
    )).sort();
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const previousDate = new Date(uniqueDates[i - 1]);
      
      // Calculate difference in days
      const diffTime = currentDate.getTime() - previousDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (diffDays > 1) {
        // Reset streak if gap is more than 1 day
        currentStreak = 1;
      }
      // If same day, don't increment streak
    }
    
    // If we only have one commit day, the streak is 1
    if (uniqueDates.length === 1) {
      longestStreak = 1;
    }
  }

  // Get commit stats from the repository
  const { data: repoStats } = await octokit.repos.getParticipationStats({
    owner,
    repo,
  });
  
  // Calculate total commits from all time (includes all branches)
  const totalCommits = allCommits.length;
  
  return {
    total_commits: totalCommits,
    last_commit_date: sortedCommits[sortedCommits.length - 1]?.commit.author?.date || '',
    first_commit_date: sortedCommits[0]?.commit.author?.date || '',
    longest_streak_days: longestStreak,
    commit_frequency: frequency,
    commit_stats: {
      weekly: repoStats.all || [],
      total_weekly_commits: (repoStats.all || []).reduce((sum, count) => sum + count, 0),
      unique_days_with_commits: new Set(commitDates.map(d => d.toISOString().split('T')[0])).size,
    },
  };
}

async function analyzeCollaboration(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  const [
    { data: contributors },
    { data: issues },
    { data: prs }
  ] = await Promise.all([
    octokit.repos.listContributors({ owner, repo }),
    octokit.issues.listForRepo({ owner, repo, state: 'all' }),
    octokit.pulls.list({ owner, repo, state: 'all' })
  ]);

  return {
    contributors: contributors.length,
    totalIssues: issues.length,
    closedIssues: issues.filter((i: IssueResponse) => i.state === 'closed').length,
    totalPRs: prs.length,
    mergedPRs: prs.filter((pr: PullResponse) => pr.merged_at !== null).length,
  };
}

async function analyzeCodeQuality(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  // Check for common test and CI files (this is unchanged)
  const { data: files } = await octokit.repos.getContent({
    owner,
    repo,
    path: "",
  });

  const hasTests = Array.isArray(files) && files.some(f =>
    f.type === "dir" && ["test", "tests", "__tests__"].includes(f.name)
  );

  const hasCI = Array.isArray(files) && files.some(f =>
    (f.type === "dir" && f.name === ".github") ||
    (f.type === "file" && f.name.includes(".yml"))
  );

  // ——— CACHE CHECK: only hit GitHub once per repo ———
  let dependencies = { deps: 0, devDeps: 0 };
  const key = `${owner}/${repo}`;
  // Pass your GitHub token so the helper can authenticate. If you aren’t
  // using a token for unauthenticated requests, you can omit the third argument.
  const pkgExists = await checkPackageJsonExists(owner, repo, /* token= */ undefined);

  if (pkgExists) {
    // Now we know package.json is present (or at least it was when first checked).
    // If you want, you can skip the second network call entirely by storing
    // the parsed JSON inside the cache helper. But here we’ll just fetch once more:
    try {
      const { data: packageJson } = await octokit.repos.getContent({
        owner,
        repo,
        path: "package.json",
      });
      if ("content" in packageJson) {
        const contentObj = JSON.parse(
          Buffer.from(packageJson.content, "base64").toString()
        );
        dependencies = {
          deps: Object.keys(contentObj.dependencies || {}).length,
          devDeps: Object.keys(contentObj.devDependencies || {}).length,
        };
      }
    } catch {
      // If for some reason this second call fails, we’ll just leave deps/devDeps at 0.
    }
  }
  // ——— END CACHE CHECK ———

  return {
    has_tests: hasTests,
    test_directory_files: 0, // (unchanged)
    has_ci: hasCI,
    has_linter: dependencies.devDeps > 0,
    has_prettier: dependencies.devDeps > 0,
    dependency_count: dependencies.deps,
    dev_dependency_count: dependencies.devDeps,
  };
}


async function analyzeTechStack(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  // First, consult the cache (or do a one-time fetch under the hood).
  const pkgExists = await checkPackageJsonExists(owner, repo, /* token= */ undefined);

  if (pkgExists) {
    // Only if package.json definitely exists do we call GitHub again to read it
    try {
      const { data: packageJson } = await octokit.repos.getContent({
        owner,
        repo,
        path: "package.json",
      });
      if ("content" in packageJson) {
        const contentObj = JSON.parse(
          Buffer.from(packageJson.content, "base64").toString()
        );
        const frameworks: string[] = [];
        if (contentObj.dependencies) {
          if (contentObj.dependencies.react) frameworks.push("React");
          if (contentObj.dependencies.vue) frameworks.push("Vue");
          if (contentObj.dependencies.angular) frameworks.push("Angular");
          if (contentObj.dependencies.next) frameworks.push("Next.js");
        }
        return {
          frameworks,
          major_libraries: Object.keys(contentObj.dependencies || {}),
          dev_tools: Object.keys(contentObj.devDependencies || {}),
        };
      }
    } catch {
      // If reading failed for any reason, we fall back to empty arrays
    }
  }

  // If package.json doesn’t exist (or first‐time fetch failed), return empty arrays:
  return {
    frameworks: [],
    major_libraries: [],
    dev_tools: [],
  };
}

export function aggregateLanguagesByYear(repos: RepoMetrics[]): YearlyLanguages {
  const yearlyLanguages: YearlyLanguages = {};
  
  repos.forEach(repo => {
    const year = new Date(repo.created_at).getFullYear();
    if (!yearlyLanguages[year]) yearlyLanguages[year] = {};
    
    if (repo.language) {
      yearlyLanguages[year][repo.language] = 
        (yearlyLanguages[year][repo.language] || 0) + 1;
    }
  });

  return yearlyLanguages;
}
