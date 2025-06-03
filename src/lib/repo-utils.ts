import { GitHubRepo } from "@/types/github";

export interface LanguageStats {
  [language: string]: number; // language name to percentage (0-100)
}

export function calculateLanguagePercentages(languages: { [key: string]: number }): LanguageStats {
  const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  const percentages: LanguageStats = {};
  
  for (const [language, bytes] of Object.entries(languages)) {
    percentages[language] = (bytes / totalBytes) * 100;
  }
  
  return percentages;
}

export function getLastCodedDate(repos: GitHubRepo[]): Date | null {
  if (!repos.length) return null;
  
  return repos.reduce((latest, repo) => {
    const date = repo.pushed_at ? new Date(repo.pushed_at) : new Date(0);
    return date > latest ? date : latest;
  }, new Date(0));
}

export function formatDateRange(dateString: string): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

export function formatLastCoded(date: Date | null): string {
  if (!date) return 'N/A';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
