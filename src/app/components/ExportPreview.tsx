"use client"

import { useRef } from 'react'
import type { ExportConfig, ProjectExport, StackSummary } from '../types/export'

type ExportPreviewProps = {
  config: ExportConfig
  userProfile: {
    name: string
    avatarUrl: string
    githubUrl: string
    bio: string | null
  }
  stackSummary: StackSummary
  projects: ProjectExport[]
}

export default function ExportPreview({ config, userProfile, stackSummary, projects }: ExportPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  return (
    <div 
      ref={previewRef}
      className="w-[21cm] min-h-[29.7cm] mx-auto p-8"
      style={{ 
        backgroundColor: '#ffffff',
        color: '#1a1a1a'
      }}
    >
      {/* Identity Section */}
      {config.sections.identity && (
        <div className="flex items-start gap-6 mb-8">
          <img 
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-24 h-24 rounded-full"
          />
          <div>
            <h1 className="text-3xl font-bold">{userProfile.name}</h1>
            <a 
              href={userProfile.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#2563eb]"
            >
              GitHub Profile
            </a>
            {userProfile.bio && (
              <p className="mt-2" style={{ color: '#4b5563' }}>{userProfile.bio}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        {/* Stack Summary Section */}
        {config.sections.stack && (
          <div className="col-span-1">
            <h2 className="text-xl font-semibold mb-4">Technical Stack</h2>
            <div className="space-y-3">
              {stackSummary.languages.map(lang => (
                <div key={lang.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{lang.name}</span>
                    <span>{lang.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#f3f4f6' }}>
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        backgroundColor: '#2563eb',
                        width: `${lang.percentage}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {stackSummary.topFrameworks.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Frameworks & Tools</h3>
                <div className="flex flex-wrap gap-2">
                  {stackSummary.topFrameworks.map(framework => (
                    <span 
                      key={framework}
                      className="px-2 py-1 rounded-full text-sm"
                      style={{ backgroundColor: '#f3f4f6' }}
                    >
                      {framework}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Projects Section */}
        {config.sections.projects && (
          <div className="col-span-2">
            <h2 className="text-xl font-semibold mb-4">Notable Projects</h2>
            <div className="space-y-6">
              {projects.slice(0, config.maxProjects).map(project => (
                <div key={project.name} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        <a 
                          href={project.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#2563eb' }}
                        >
                          {project.name}
                        </a>
                      </h3>
                      <p className="mt-1" style={{ color: '#4b5563' }}>{project.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {project.language && (
                        <span className="px-2 py-1 rounded-full" style={{ backgroundColor: '#f3f4f6' }}>
                          {project.language}
                        </span>
                      )}
                      <span>⭐ {project.stars}</span>
                    </div>
                  </div>

                  {config.includeReadmeBullets && project.bullets.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm list-disc list-inside" style={{ color: '#4b5563' }}>
                      {project.bullets.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}

                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-1 rounded-full text-sm"
                          style={{ backgroundColor: '#f3f4f6' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visuals Section */}
      {config.sections.visuals && (
        <div className="mt-8 grid grid-cols-2 gap-8">
          {config.includePieChart && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Language Distribution</h2>
              {/* We'll implement the pie chart using a library like Chart.js */}
              <div className="h-64 rounded flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
                [Language Pie Chart]
              </div>
            </div>
          )}

          {config.includeCommitHeatmap && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Contribution Activity</h2>
              {/* We'll implement the heatmap using a library like react-calendar-heatmap */}
              <div className="h-64 rounded flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
                [Commit Heatmap]
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keywords Section */}
      {config.sections.keywords && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Technology Keywords</h2>
          {/* We'll implement the word cloud using a library like react-wordcloud */}
          <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
            [Keyword Cloud]
          </div>
        </div>
      )}
    </div>
  )
}
