"use client";

import { useState, useMemo } from "react";
import type { ExportConfig, ExportSection } from "../../types/export";
import { GitHubRepo } from "../../types/github";
import {
  FiChevronDown,
  FiCheck,
  FiPlus,
  FiMinus,
  FiInfo,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";

type ExportConfigProps = {
  config: ExportConfig;
  onConfigChange: (config: ExportConfig) => void;
  onExport: () => Promise<void>;
  disabled?: boolean;
  repos: GitHubRepo[];
  selectedRepos: Set<string>;
  onToggleRepo: (repoId: string) => void;
  onGenerateAiSummary: (repo: GitHubRepo) => Promise<void>;
  isGeneratingAi: boolean;
};

export default function ExportConfig({
  config,
  onConfigChange,
  onExport,
  disabled = false,
  repos = [],
  selectedRepos = new Set(),
  onToggleRepo,
  onGenerateAiSummary,
  isGeneratingAi = false,
}: ExportConfigProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    content: true,
    projects: true,
    ai: false,
    appearance: false,
  });

  const toggleSection = (section: ExportSection) => {
    const newSections = {
      ...config.sections,
      [section]: !config.sections[section],
    };

    // If projects are disabled, clear selected repos
    if (section === "projects" && !newSections.projects) {
      onConfigChange({
        ...config,
        sections: newSections,
        maxProjects: 0,
      });
    } else {
      onConfigChange({
        ...config,
        sections: newSections,
      });
    }
  };

  const updateConfig = <K extends keyof ExportConfig>(
    key: K,
    value: ExportConfig[K]
  ) => {
    onConfigChange({
      ...config,
      [key]: value,
    });
  };

  const toggleSectionExpand = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleSelectAllRepos = () => {
    if (selectedRepos.size > 0) {
      // Clear selection
      onConfigChange({
        ...config,
        maxProjects: 0,
      });
    } else {
      // Select up to max projects
      const newMax = Math.min(5, repos.length);
      onConfigChange({
        ...config,
        maxProjects: newMax,
      });

      // Auto-select first N repos
      const newSelection = new Set<string>();
      repos.slice(0, newMax).forEach((repo) => {
        onToggleRepo(repo.id.toString());
      });
    }
  };

  const filteredRepos = useMemo(() => {
    return repos
      .filter((repo) => !repo.fork) // Filter out forked repos by default
      .sort((a, b) => b.stargazers_count - a.stargazers_count); // Sort by stars
  }, [repos]);

  return (
    <div className="space-y-6">
      {/* Content Sections */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => toggleSectionExpand("content")}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Content</span>
          <FiChevronDown
            className={`transition-transform duration-200 ${
              expandedSections.content ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.content && (
          <div className="space-y-3 pl-4">
            {Object.entries(config.sections).map(([section, enabled]) => (
              <label key={section} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={disabled}
                  onChange={() => toggleSection(section as ExportSection)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="capitalize">{section}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Project Selection */}
      {config.sections.projects && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => toggleSectionExpand("projects")}
            className="flex items-center justify-between w-full text-left font-medium"
          >
            <span>Project Selection</span>
            <FiChevronDown
              className={`transition-transform duration-200 ${
                expandedSections.projects ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.projects && (
            <div className="space-y-3 pl-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Projects to Include (max {config.maxProjects})
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAllRepos}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {selectedRepos.size > 0 ? "Clear All" : "Select All"}
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                {filteredRepos.map((repo) => (
                  <div key={repo.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id={`repo-${repo.id}`}
                      checked={selectedRepos.has(repo.id.toString())}
                      onChange={() => onToggleRepo(repo.id.toString())}
                      disabled={
                        !selectedRepos.has(repo.id.toString()) &&
                        selectedRepos.size >= config.maxProjects
                      }
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`repo-${repo.id}`}
                      className="flex-1 text-sm"
                    >
                      <div className="font-medium">{repo.name}</div>
                      {repo.description && (
                        <div className="text-gray-500 text-xs line-clamp-1">
                          {repo.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {repo.language && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {repo.language}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center">
                          ⭐ {repo.stargazers_count}
                        </span>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGenerateAiSummary(repo);
                      }}
                      disabled={isGeneratingAi || !!repo.description}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      title="Generate AI summary"
                    >
                      {isGeneratingAi ? "Generating..." : "AI Enhance"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium mb-1">
                  Max Projects to Show
                </label>
                <select
                  value={config.maxProjects}
                  onChange={(e) =>
                    updateConfig("maxProjects", Number(e.target.value))
                  }
                  disabled={disabled || !config.sections.projects}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "project" : "projects"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Features */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => toggleSectionExpand("ai")}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>AI Enhancements</span>
          <FiChevronDown
            className={`transition-transform duration-200 ${
              expandedSections.ai ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.ai && (
          <div className="space-y-3 pl-4">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeReadmeBullets}
                onChange={(e) =>
                  updateConfig("includeReadmeBullets", e.target.checked)
                }
                disabled={disabled || !config.sections.projects}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div>Include README Bullets</div>
                <p className="text-xs text-gray-500">
                  Add AI-generated bullet points for each project
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeDeveloperSummary}
                onChange={(e) =>
                  updateConfig("includeDeveloperSummary", e.target.checked)
                }
                disabled={disabled || !config.sections.identity}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div>Developer Summary</div>
                <p className="text-xs text-gray-500">
                  Add an AI-generated professional summary
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeKeywords}
                onChange={(e) =>
                  updateConfig("includeKeywords", e.target.checked)
                }
                disabled={disabled || !config.sections.keywords}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div>Keyword Analysis</div>
                <p className="text-xs text-gray-500">
                  Show top technologies and skills
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Visuals */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => toggleSectionExpand("appearance")}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Visual Elements</span>
          <FiChevronDown
            className={`transition-transform duration-200 ${
              expandedSections.appearance ? "rotate-180" : ""
            }`}
          />
        </button>

        {expandedSections.appearance && (
          <div className="space-y-3 pl-4">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeCommitHeatmap}
                onChange={(e) =>
                  updateConfig("includeCommitHeatmap", e.target.checked)
                }
                disabled={disabled || !config.sections.visuals}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div>Commit Heatmap</div>
                <p className="text-xs text-gray-500">
                  Show your GitHub contribution activity
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includePieChart}
                onChange={(e) =>
                  updateConfig("includePieChart", e.target.checked)
                }
                disabled={disabled || !config.sections.visuals}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div>Language Distribution</div>
                <p className="text-xs text-gray-500">
                  Show a pie chart of your top languages
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.includeTechStack}
                onChange={(e) =>
                  updateConfig("includeTechStack", e.target.checked)
                }
                disabled={disabled || !config.sections.stack}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div>Technology Stack</div>
                <p className="text-xs text-gray-500">
                  Show your technology stack with proficiency levels
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onExport}
          disabled={disabled || isGeneratingAi}
          className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
        >
          {isGeneratingAi ? (
            <>
              <FiRefreshCw className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FiDownload />
              Export PDF
            </>
          )}
        </button>

        <p className="mt-2 text-xs text-gray-500 text-center">
          Your PDF will include all selected sections and projects
        </p>
      </div>
    </div>
  );
}
