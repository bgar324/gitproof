export type ExportSection = 'identity' | 'stack' | 'projects' | 'visuals' | 'keywords'

export type ExportConfig = {
  sections: Record<ExportSection, boolean>
  maxProjects: number
  includeMetrics: boolean
  includeCommitHeatmap?: boolean  // Made optional as it's no longer used in the UI
  includePieChart?: boolean      // Made optional as it's no longer used in the UI
  includeDeveloperSummary: boolean
  includeKeywords: boolean
  includeTechStack: boolean
}

export type ProjectExport = {
  id: string | number
  name: string
  full_name: string
  summary: string
  description: string | null
  tags: string[]
  bullets: string[]
  url: string
  html_url: string
  language: string | null
  languages_url: string
  stars: number
  stargazers_count: number
  forks_count: number
  commit_count?: number
  pushed_at: string
  created_at: string
  updated_at: string
  hasReadme?: boolean
  homepage?: string | null
  owner: {
    login: string
    avatar_url: string
    html_url: string
  },
  languages?: Record<string, number> // Added for language percentages
}

export type StackSummary = {
  languages: Array<{
    name: string
    percentage: number
  }>
  topFrameworks: string[]
  mostActiveTime: string
  stats?: {
    repositoryCount: number
    totalCommits: number
    longestStreak: number
    totalStars: number
  }
}
