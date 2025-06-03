"use client";

import { useState, useCallback, useMemo } from "react";
import { FiX, FiDownload, FiRefreshCw } from "react-icons/fi";
import { GitHubRepo } from "@/types/github";
import {
  ExportConfig as ExportConfigType,
  ProjectExport,
  StackSummary,
} from "@/types/export";
import type { ExportConfig } from "@/types/export";
import { useSession } from "next-auth/react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PdfDocument from "./PdfDocument";
import { format } from "date-fns";

type ExportStatus = "idle" | "generating" | "success" | "error";

interface UserProfile {
  name: string;
  login: string;
  avatar_url: string;
  bio?: string | null;
  location?: string;
  email?: string;
  blog?: string;
  twitter_username?: string;
  company?: string;
  html_url: string;
}

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  repos: GitHubRepo[];
  topLanguages: Array<{ name: string; percentage: number }>;
}

const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  userProfile,
  repos,
  topLanguages,
}) => {
  const { data: session } = useSession();
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    // Default sections
    sections: {
      identity: true,
      stack: true,
      projects: true,
      visuals: false, // Removed but kept in type for backward compatibility
      keywords: false, // Removed but kept in type for backward compatibility
    },
    maxProjects: 3, // Hardcoded to 3 as per requirements
    includeReadmeBullets: true,
    includeDeveloperSummary: true,
    includeKeywords: false, // Removed as per requirements
    includeTechStack: false, // Removed as per requirements
    includeCommitHeatmap: false,
    includePieChart: false,
  });

  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const generatedAt = useMemo(() => format(new Date(), "MMMM d, yyyy"), []);

  const handleSectionToggle = (section: keyof ExportConfig["sections"]) => {
    setExportConfig((cfg) => ({
      ...cfg,
      sections: {
        ...cfg.sections,
        [section]: !cfg.sections[section],
      },
    }));
  };

  const handleToggleRepo = useCallback(
    (repoId: string) => {
      if (!repoId) return;

      setSelectedRepos((prev) => {
        try {
          const newSet = new Set(prev);
          if (newSet.has(repoId)) {
            newSet.delete(repoId);
          } else {
            // Ensure we don't exceed max projects
            if (newSet.size < exportConfig.maxProjects) {
              newSet.add(repoId);
            }
          }
          return newSet;
        } catch (error) {
          console.error("Error toggling repo:", error);
          return prev;
        }
      });
    },
    [exportConfig.maxProjects]
  );

  const pdfProjects = useMemo<ProjectExport[]>(() => {
    try {
      if (!Array.isArray(repos) || !selectedRepos.size) return [];

      return repos
        .filter((repo) => repo?.id && selectedRepos.has(repo.id.toString()))
        .map((repo) => ({
          id: repo.id?.toString() || "",
          name: repo.name || "Untitled Project",
          full_name: repo.full_name || "",
          summary: repo.description || "",
          description: repo.description || "",
          tags: Array.isArray(repo.topics) ? repo.topics : [],
          bullets: [],
          url: repo.html_url || "#",
          html_url: repo.html_url || "#",
          language: repo.language || "Other",
          languages_url: repo.languages_url || "",
          stars: repo.stargazers_count || 0,
          stargazers_count: repo.stargazers_count || 0,
          forks_count: repo.forks_count || 0,
          pushed_at: repo.pushed_at || "",
          created_at: repo.created_at || "",
          updated_at: repo.updated_at || "",
          hasReadme: !!repo.has_readme,
          owner: {
            login: repo.owner?.login || "",
            avatar_url: repo.owner?.avatar_url || "",
            html_url: repo.owner?.html_url || "",
          },
        }));
    } catch (error) {
      console.error("Error preparing projects for PDF:", error);
      return [];
    }
  }, [repos, selectedRepos]);

  const stackSummary: StackSummary = useMemo(
    () => ({
      languages: topLanguages,
      topFrameworks: [],
      mostActiveTime: "Afternoon",
      stats: {
        repositoryCount: repos.length,
        totalCommits: 0,
        longestStreak: 0,
        totalStars: repos.reduce(
          (sum, repo) => sum + (repo.stargazers_count || 0),
          0
        ),
      },
    }),
    [topLanguages, repos]
  );

  const pdfKey = [
    exportConfig.sections.identity ? "id1" : "id0",
    exportConfig.sections.stack ? "st1" : "st0",
    exportConfig.sections.projects ? "pr1" : "pr0",
    Array.from(selectedRepos).sort().join("_"),
    exportConfig.maxProjects,
    exportConfig.includeReadmeBullets ? "rd1" : "rd0",
    exportConfig.includeDeveloperSummary ? "ds1" : "ds0",
    exportConfig.includeKeywords ? "kw1" : "kw0",
    exportConfig.includeTechStack ? "ts1" : "ts0",
    exportConfig.includeCommitHeatmap ? "cm1" : "cm0",
    exportConfig.includePieChart ? "pc1" : "pc0",
  ].join("|");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all">
      <div
        className="
          w-full max-w-2xl mx-auto
          rounded-2xl
          shadow-xl
          bg-white/80
          backdrop-blur-lg
          border border-gray-200
          relative
          flex flex-col
          min-h-[520px]
          max-h-[88vh]
          ring-1 ring-black/5
        "
        style={{ fontFamily: "inherit" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white/90 backdrop-blur-lg rounded-t-xl">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-3 items-center">
              <img
                src="/gitprooflogo.png"
                alt="Git Proof Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-2xl font-bold tracking-tight leading-none">
                Git Proof
              </span>
            </div>
            <span className="text-xs font-medium text-gray-500 ml-11 mt-0.5">
              Export PDF
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 rounded-full p-2 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
            {/* Section toggles */}
            <div>
              <h3 className="text-xl font-bold mb-4">Content Sections</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    checked={exportConfig.sections.identity}
                    disabled={isExporting}
                    onChange={(e) =>
                      setExportConfig((cfg) => ({
                        ...cfg,
                        sections: {
                          ...cfg.sections,
                          identity: e.target.checked,
                        },
                      }))
                    }
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Identity
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                      Your professional profile including name, bio, and GitHub
                      profile link.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    checked={exportConfig.sections.stack}
                    disabled={isExporting}
                    onChange={(e) =>
                      setExportConfig((cfg) => ({
                        ...cfg,
                        sections: {
                          ...cfg.sections,
                          stack: e.target.checked,
                        },
                      }))
                    }
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Tech Stack
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                      Your most-used programming languages and top technologies
                      across all repositories.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    checked={exportConfig.sections.projects}
                    disabled={isExporting}
                    onChange={(e) =>
                      setExportConfig((cfg) => ({
                        ...cfg,
                        sections: {
                          ...cfg.sections,
                          projects: e.target.checked,
                        },
                      }))
                    }
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Projects (max 3)
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                      Your selected projects with descriptions, tech stack, and
                      key metrics.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project selection */}
            <div>
              <h3 className="text-xl font-bold mb-4">
                Projects to Include{" "}
                <span className="text-base text-gray-400">
                  (max {exportConfig.maxProjects})
                </span>
              </h3>
              <div
                className="
    p-3
    border
    rounded-lg
    bg-gray-50/70
    border-gray-200
    max-h-56
    overflow-y-hidden
    hover:overflow-y-auto
    transition-all
    space-y-2
    scrollbar-thin
    scrollbar-thumb-gray-300
    scrollbar-track-transparent
  "
                style={{
                  minHeight: "56px",
                }}
              >
                {repos.map((repo, idx) => (
                  <label
                    key={repo.id}
                    className={`flex items-start gap-3 text-base px-2 py-2 rounded-lg transition-all ${
                      selectedRepos.has(repo.id.toString())
                        ? "bg-blue-50 border border-blue-100"
                        : "hover:bg-gray-100"
                    }`}
                    style={{
                      opacity:
                        idx >= exportConfig.maxProjects &&
                        !selectedRepos.has(repo.id.toString())
                          ? 0.6
                          : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRepos.has(repo.id.toString())}
                      disabled={
                        !selectedRepos.has(repo.id.toString()) &&
                        selectedRepos.size >= exportConfig.maxProjects
                      }
                      onChange={() => handleToggleRepo(repo.id.toString())}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                    />
                    <div>
                      <div className="font-semibold text-base">{repo.name}</div>
                      {repo.description && (
                        <div className="text-gray-500 text-xs mt-0.5">
                          {repo.description}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {repo.language && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {repo.language}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 flex items-center">
                          ⭐ {repo.stargazers_count}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional options */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={exportConfig.includeReadmeBullets}
                  onChange={(e) =>
                    setExportConfig((cfg) => ({
                      ...cfg,
                      includeReadmeBullets: e.target.checked,
                    }))
                  }
                  disabled={isExporting}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    AI README Bullets
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Include key points extracted from your project READMEs using
                    AI.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={exportConfig.includeDeveloperSummary}
                  onChange={(e) =>
                    setExportConfig((cfg) => ({
                      ...cfg,
                      includeDeveloperSummary: e.target.checked,
                    }))
                  }
                  disabled={isExporting}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    Developer Summary
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Add an AI-generated summary of your development experience
                    and expertise.
                  </p>
                </div>
              </div>
            </div>

            {/* PDF Download Link */}
            <PDFDownloadLink
              key={pdfKey}
              document={
                <PdfDocument
                  config={exportConfig}
                  userProfile={{
                    name: userProfile.name,
                    avatarUrl: userProfile.avatar_url,
                    githubUrl: userProfile.html_url,
                    bio: userProfile.bio ?? null,
                  }}
                  projects={pdfProjects}
                  stackSummary={stackSummary}
                  generatedAt={generatedAt}
                />
              }
              fileName="gitproof-export.pdf"
              className="w-full mt-4"
            >
              {({ loading }) => (
                <button
                  type="button"
                  disabled={loading || isExporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FiDownload />
                      Download PDF
                    </>
                  )}
                </button>
              )}
            </PDFDownloadLink>

            <p className="mt-5 text-base text-gray-400 text-center">
              Your PDF will include all selected sections and projects.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
