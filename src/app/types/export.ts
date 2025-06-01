export type ExportSection = 'identity' | 'stack' | 'projects' | 'visuals' | 'keywords'

export type ExportConfig = {
  sections: Record<ExportSection, boolean>
  maxProjects: number
  includeReadmeBullets: boolean
  includeCommitHeatmap: boolean
  includePieChart: boolean
}

export type ProjectExport = {
  name: string
  summary: string
  tags: string[]
  bullets: string[]
  url: string
  language: string | null
  stars: number
}

export type StackSummary = {
  languages: Array<{
    name: string
    percentage: number
  }>
  topFrameworks: string[]
  mostActiveTime: string
}
