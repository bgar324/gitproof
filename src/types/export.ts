export type ExportSection = 'identity' | 'stack' | 'projects' | 'visuals' | 'keywords'

export type ExportConfig = {
  sections: Record<ExportSection, boolean>
  maxProjects: number
  includeReadmeBullets: boolean
  includeCommitHeatmap: boolean
  includePieChart: boolean
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
}
