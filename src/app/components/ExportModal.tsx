"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
    sections: {
      identity: true,
      stack: true,
      projects: true,
      visuals: false,
      keywords: false,
    },
    maxProjects: 3,
    includeMetrics: true,
    includeDeveloperSummary: true,
    includeKeywords: false,
    includeTechStack: false,
    includeCommitHeatmap: false,
    includePieChart: false,
  });

  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

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

  const [pdfProjects, setPdfProjects] = useState<ProjectExport[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [developerSummary, setDeveloperSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    if (!exportConfig.includeMetrics) {
      setMetrics(null);
      return;
    }
    if (!repos || !repos.length) {
      setMetrics(null);
      return;
    }
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/ai/quick-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repos,
            createdAt: new Date().toISOString(),
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics || null);
        } else {
          setMetrics(null);
        }
      } catch {
        setMetrics(null);
      }
    };
    fetchMetrics();
  }, [exportConfig.includeMetrics, repos]);

  useEffect(() => {
    const prepareProjects = async () => {
      if (!Array.isArray(repos) || !selectedRepos.size) {
        setPdfProjects([]);
        return;
      }
      setIsLoadingProjects(true);
      try {
        const fetchRepoLanguages = async (owner: string, repoName: string) => {
          if (!session?.accessToken) return {};
          try {
            const response = await fetch(
              `https://api.github.com/repos/${owner}/${repoName}/languages`,
              {
                headers: {
                  Authorization: `token ${session.accessToken}`,
                  Accept: "application/vnd.github.v3+json",
                },
              }
            );
            if (response.ok) {
              return await response.json();
            }
            return {};
          } catch (error) {
            console.error(
              `Error fetching languages for ${owner}/${repoName}:`,
              error
            );
            return {};
          }
        };
        const projects = await Promise.all(
          repos
            .filter((repo) => repo?.id && selectedRepos.has(repo.id.toString()) || []).map(async (repo) => {
              const languages = await fetchRepoLanguages(
                repo.owner.login,
                repo.name
              );
              return {
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
                languages,
                owner: {
                  login: repo.owner?.login || "",
                  avatar_url: repo.owner?.avatar_url || "",
                  html_url: repo.owner?.html_url || "",
                },
              };
            })
        );
        setPdfProjects(projects);
      } catch (error) {
        console.error("Error preparing projects for PDF:", error);
        setPdfProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    prepareProjects();
  }, [repos, selectedRepos, session?.accessToken]);

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

  useEffect(() => {
    const fetchDeveloperSummary = async () => {
      if (
        !exportConfig.includeDeveloperSummary ||
        developerSummary !== null ||
        isGeneratingSummary
      )
        return;
      setIsGeneratingSummary(true);
      try {
        const response = await fetch("/api/ai/pdf-summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repos: repos, // This should be the full list, not filtered!
            createdAt: new Date().toISOString(),
            name: userProfile.name || userProfile.login,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setDeveloperSummary(data.summary || "");
        } else {
          await response.text();
        }
      } catch (error) {
        setDeveloperSummary("");
      } finally {
        setIsGeneratingSummary(false);
      }
    };
    fetchDeveloperSummary();
  }, [
    exportConfig.includeDeveloperSummary,
    pdfProjects,
    userProfile,
    isGeneratingSummary,
    developerSummary,
  ]);

  const pdfKey = [
    exportConfig.sections.identity ? "id1" : "id0",
    exportConfig.sections.stack ? "st1" : "st0",
    exportConfig.sections.projects ? "pr1" : "pr0",
    Array.from(selectedRepos).sort().join("_"),
    exportConfig.maxProjects,
    exportConfig.includeMetrics ? "rd1" : "rd0",
    exportConfig.includeDeveloperSummary
      ? `ds1-${developerSummary ? "1" : "0"}`
      : "ds0",
    exportConfig.includeKeywords ? "kw1" : "kw0",
    exportConfig.includeTechStack ? "ts1" : "ts0",
    exportConfig.includeCommitHeatmap ? "cm1" : "cm0",
    exportConfig.includePieChart ? "pc1" : "pc0",
  ].join("|");

  if (!open) return null;

  const isReady =
    pdfProjects &&
    Array.isArray(pdfProjects) &&
    pdfProjects.length > 0 &&
    !isLoadingProjects;

  const isDownloadReady =
    Array.isArray(pdfProjects) &&
    pdfProjects.length > 0 &&
    stackSummary &&
    (!exportConfig.includeDeveloperSummary || developerSummary !== null) &&
    !isLoadingProjects;

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
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Export Portfolio
            </h2>
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
          <form
            className="space-y-10"
            onSubmit={(e: React.FormEvent) => e.preventDefault()}
          >
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
                {(repos || []).map((repo, idx) => (
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
                  checked={exportConfig.includeDeveloperSummary}
                  onChange={(e) =>
                    setExportConfig((cfg) => ({
                      ...cfg,
                      includeDeveloperSummary: e.target.checked,
                    }))
                  }
                  disabled={isExporting || isGeneratingSummary}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900 flex items-center">
                    AI Developer Summary
                    {isGeneratingSummary && (
                      <FiRefreshCw className="animate-spin ml-2 h-3 w-3 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Include an AI-generated professional summary highlighting
                    your experience and achievements.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={exportConfig.includeMetrics}
                  onChange={(e) =>
                    setExportConfig((cfg) => ({
                      ...cfg,
                      includeMetrics: e.target.checked,
                    }))
                  }
                  disabled={isExporting}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">Metrics</div>
                  <p className="text-sm text-gray-500 mt-1">
                    Repository Count, Total Commit Count, and Longest Commit
                    Streak.
                  </p>
                </div>
              </div>
            </div>
          </form>
          {/* PDF Download Link */}
          {isDownloadReady && (
            <PDFDownloadLink
              key={pdfKey}
              document={
                <PdfDocument
                  key={`pdf-${pdfKey}`}
                  config={exportConfig}
                  userProfile={{
                    name: userProfile.name || userProfile.login,
                    avatarUrl: userProfile.avatar_url,
                    githubUrl: userProfile.html_url,
                    bio: userProfile.bio || null,
                  }}
                  projects={pdfProjects}
                  stackSummary={stackSummary}
                  generatedAt={generatedAt}
                  developerSummary={developerSummary}
                  metrics={metrics}
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
          )}
          <p className="mt-5 text-base text-gray-400 text-center">
            Your PDF will include all selected sections and projects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
