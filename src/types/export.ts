export type ExportSection = 'identity' | 'stack' | 'projects' | 'visuals' | 'keywords'

export type ExportConfig = {
  sections: Record<ExportSection, boolean>
  maxProjects: number
  includeReadmeBullets: boolean
  includeCommitHeatmap?: boolean  // Made optional as it's no longer used in the UI
  includePieChart?: boolean      // Made optional as it's no longer used in the UI
  includeDeveloperSummary: boolean
  includeKeywords: boolean
  includeTechStack: boolean
}

export type ProjectExport = {
  id: string | number
  name: string
  summary: string
  tags: string[]
  bullets: string[]
  url: string
  language: string | null
  stars: number
  hasReadme?: boolean
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
