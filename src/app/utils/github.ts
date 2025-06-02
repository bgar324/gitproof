// import { GitHubRepo, GitHubUser } from "@/app/types";
import { GitHubRepo, GitHubOwner } from "../types/github";

// Get GitHub stats for a user
export const getGitHubStats = async (accessToken: string) => {
  // Implementation from your existing code
  // This is a placeholder - replace with your actual implementation
  return {
    repos: [],
    topLanguages: [],
    totalStars: 0,
    totalForks: 0,
    totalRepos: 0,
    accountAge: '2 years',
    commitStreak: 0,
    growthScore: 0,
  };
};

// Analyze repositories using AI
export const analyzeRepositories = async (repos: GitHubRepo[], user: GitHubOwner) => {
  // In a real implementation, this would call your AI service
  // For now, we'll return mock data
  return {
    summary: `Experienced ${repos.length > 10 ? 'senior' : 'junior'} developer with a strong focus on ${repos[0]?.language || 'various'} technologies. Shows consistent contributions and clean code practices.`,
    developerType: determineDeveloperType(repos),
    skillEvolution: determineSkillEvolution(repos),
    growthScore: calculateGrowthScore(repos),
  };
};

// Helper function to determine developer type based on repositories
const determineDeveloperType = (repos: GitHubRepo[]): string => {
  const languages = repos.reduce((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] || 'various';
  
  const hasFrontend = repos.some(repo => 
    repo.topics?.some(topic => 
      ['react', 'vue', 'angular', 'frontend', 'ui', 'ux'].includes(topic.toLowerCase())
    ) ||
    repo.name.toLowerCase().includes('frontend')
  );
  
  const hasBackend = repos.some(repo => 
    repo.topics?.some(topic => 
      ['node', 'express', 'django', 'flask', 'spring', 'backend', 'api'].includes(topic.toLowerCase())
    ) ||
    repo.name.toLowerCase().includes('backend') ||
    repo.name.toLowerCase().includes('api')
  );

  if (hasFrontend && hasBackend) return 'Full Stack Developer';
  if (hasFrontend) return `Frontend Developer (${topLanguage})`;
  if (hasBackend) return `Backend Developer (${topLanguage})`;
  return `Software Developer (${topLanguage})`;
};

// Helper function to determine skill evolution
const determineSkillEvolution = (repos: GitHubRepo[]): string => {
  if (repos.length === 0) return 'No repositories found';
  
  // Sort repos by creation date
  const sortedRepos = [...repos].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const firstYear = new Date(sortedRepos[0].created_at).getFullYear();
  const lastYear = new Date(sortedRepos[sortedRepos.length - 1].created_at).getFullYear();
  
  if (firstYear === lastYear) {
    return `Started with ${sortedRepos[0].language || 'programming'} in ${firstYear}`;
  }
  
  return `Started with ${sortedRepos[0].language || 'programming'} in ${firstYear}, ` +
         `expanding to ${sortedRepos.length} projects across multiple technologies by ${lastYear}`;
};

// Helper function to calculate a growth score (0-10)
const calculateGrowthScore = (repos: GitHubRepo[]): number => {
  if (repos.length === 0) return 0;
  
  // Simple scoring based on number of repos, stars, and forks
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
  
  // Normalize scores (these are arbitrary weights)
  const repoScore = Math.min(repos.length * 0.5, 4); // Max 4 points
  const starScore = Math.min(totalStars * 0.1, 3);    // Max 3 points
  const forkScore = Math.min(totalForks * 0.2, 3);    // Max 3 points
  
  // Calculate final score (0-10)
  const score = Math.round(repoScore + starScore + forkScore);
  
  return Math.min(10, Math.max(1, score)); // Ensure score is between 1-10
};
