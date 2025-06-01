"use client"

import { useState } from 'react'
import type { ExportConfig, ExportSection } from '../types/export'

type ExportConfigProps = {
  onConfigChange: (config: ExportConfig) => void
  onExport: () => void
}

const defaultConfig: ExportConfig = {
  sections: {
    identity: true,
    stack: true,
    projects: true,
    visuals: true,
    keywords: false
  },
  maxProjects: 3,
  includeReadmeBullets: true,
  includeCommitHeatmap: true,
  includePieChart: true
}

export default function ExportConfig({ onConfigChange, onExport }: ExportConfigProps) {
  const [config, setConfig] = useState<ExportConfig>(defaultConfig)

  const toggleSection = (section: ExportSection) => {
    const newConfig = {
      ...config,
      sections: {
        ...config.sections,
        [section]: !config.sections[section]
      }
    }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const updateConfig = <K extends keyof ExportConfig>(key: K, value: ExportConfig[K]) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Export Settings</h3>
        <div className="space-y-3">
          {Object.entries(config.sections).map(([section, enabled]) => (
            <label key={section} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => toggleSection(section as ExportSection)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="capitalize">{section}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Number of Projects
          </label>
          <select
            value={config.maxProjects}
            onChange={(e) => updateConfig('maxProjects', Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {[3, 4, 5].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.includeReadmeBullets}
            onChange={(e) => updateConfig('includeReadmeBullets', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Include README Bullets
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.includeCommitHeatmap}
            onChange={(e) => updateConfig('includeCommitHeatmap', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show Commit Heatmap
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.includePieChart}
            onChange={(e) => updateConfig('includePieChart', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show Language Pie Chart
        </label>
      </div>

      <button
        onClick={onExport}
        className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Export PDF
      </button>
    </div>
  )
}
