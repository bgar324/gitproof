"use client";

import { useState, useMemo, useRef } from "react";
import ExportConfig from "./ExportConfig";
import ExportPreview from "./ExportPreview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ExportConfig as ExportConfigType } from "../../types/export";
import { GitHubRepo } from "../../types/github";
import { FiX, FiDownload, FiRefreshCw, FiCheck } from "react-icons/fi";

type ExportStatus = "idle" | "generating" | "success" | "error";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  userProfile: {
    name: string;
    avatarUrl: string;
    githubUrl: string;
    bio: string | null;
  };
  repos: GitHubRepo[];
  topLanguages: { name: string; percentage: number }[];
}

export default function ExportModal({
  open,
  onClose,
  userProfile,
  repos,
  topLanguages,
}: ExportModalProps) {
  const [exportConfig, setExportConfig] = useState<ExportConfigType>({
    sections: {
      identity: true,
      stack: true,
      projects: true,
      visuals: true,
      keywords: false,
    },
    maxProjects: 3,
    includeReadmeBullets: true,
    includeDeveloperSummary: true,
    includeKeywords: false,
    includeTechStack: true,
  });

  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Toggle repository selection
  const toggleRepoSelection = (repoId: string) => {
    const newSelection = new Set(selectedRepos);
    if (newSelection.has(repoId)) {
      newSelection.delete(repoId);
    } else if (newSelection.size < exportConfig.maxProjects) {
      newSelection.add(repoId);
    }
    setSelectedRepos(newSelection);
  };

  // Generate AI summary for a repository
  const generateAiSummary = async (repo: GitHubRepo) => {
    if (aiSummaries[repo.name]) return;

    setIsGeneratingAi(true);
    try {
      const response = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          topics: repo.topics || [],
        }),
      });

      if (!response.ok) throw new Error("Failed to generate AI summary");
      const { summary } = await response.json();

      setAiSummaries((prev) => ({
        ...prev,
        [repo.name]: summary,
      }));
    } catch (error) {
      console.error("Error generating AI summary:", error);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handle export to PDF
  const handleExport = async () => {
    const element = document.getElementById("export-preview");
    if (!element) return;

    setExportStatus("generating");
    setIsExporting(true);

    try {
      // Wait for fonts to load
      await document.fonts.ready;
      
      // Calculate dimensions for A4 at 96 DPI
      const targetWidth = 8.27 * 96; // A4 width in pixels at 96 DPI
      const targetHeight = 11.69 * 96; // A4 height in pixels at 96 DPI

      // Create a style element for PDF-specific styles
      const style = document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Reckless:wght@400;500;600;700&display=swap');
        #export-preview {
          width: ${targetWidth}px !important;
          min-height: ${targetHeight}px !important;
          background: white !important;
          padding: 40px !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        #export-preview * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .project-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .tech-stack {
          flex-wrap: nowrap !important;
        }
        .tech-pill {
          white-space: nowrap !important;
        }
      `;
      
      // Store original styles
      const originalStyles = {
        width: element.style.width,
        minWidth: element.style.minWidth,
        maxWidth: element.style.maxWidth,
        height: element.style.height,
        minHeight: element.style.minHeight,
        maxHeight: element.style.maxHeight,
        padding: element.style.padding,
        boxShadow: element.style.boxShadow,
        borderRadius: element.style.borderRadius,
      };

      // Apply PDF-specific styles
      element.style.width = `${targetWidth}px`;
      element.style.minWidth = `${targetWidth}px`;
      element.style.maxWidth = `${targetWidth}px`;
      element.style.height = 'auto';
      element.style.overflow = 'visible';
      element.style.padding = '40px';
      element.style.boxShadow = 'none';
      element.style.borderRadius = '0';

      // Add the style to the document
      document.head.appendChild(style);
      
      // Render to canvas with html2canvas
      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: targetWidth,
        width: targetWidth,
        height: element.scrollHeight,
        onclone: (clonedDoc: Document) => {
          // Apply the same styles to the cloned document
          clonedDoc.head.appendChild(style.cloneNode(true));
          const clonedElement = clonedDoc.getElementById('export-preview');
          if (clonedElement) {
            clonedElement.classList.add('pdf-exporting');
          }
        },
      } as any); // Using 'as any' to bypass TypeScript type checking for html2canvas options

      // Clean up
      document.head.removeChild(style);
      element.classList.remove('pdf-exporting');
      
      // Restore original styles
      Object.assign(element.style, originalStyles);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Save the PDF
      pdf.save('gitproof-export.pdf');
      setExportStatus('success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare projects data with AI summaries
  const projects = useMemo(() => {
    return repos
      .filter(
        (repo) =>
          selectedRepos.has(repo.id.toString()) || selectedRepos.size === 0
      )
      .slice(0, exportConfig.maxProjects)
      .map((repo) => ({
        id: repo.id.toString(),
        name: repo.name,
        full_name: repo.full_name,
        summary: repo.description || "",
        description: repo.description,
        tags: [repo.language, ...(repo.topics || [])].filter(Boolean) as string[],
        bullets: aiSummaries[repo.name] ? [aiSummaries[repo.name]] : [],
        url: repo.html_url,
        html_url: repo.html_url,
        language: repo.language,
        languages_url: repo.languages_url,
        stars: repo.stargazers_count,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        commit_count: repo.commit_count,
        pushed_at: repo.pushed_at,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        hasReadme: true,
        homepage: repo.homepage || null,
        owner: {
          login: repo.owner?.login || '',
          avatar_url: repo.owner?.avatar_url || '',
          html_url: repo.owner?.html_url || ''
        }
      }));
  }, [repos, selectedRepos, exportConfig.maxProjects, aiSummaries]);

  // Get top frameworks from repos
  const topFrameworks = useMemo(() => {
    const frameworkCounts = new Map<string, number>();

    repos.forEach((repo) => {
      if (repo.topics) {
        repo.topics.forEach((topic) => {
          frameworkCounts.set(topic, (frameworkCounts.get(topic) || 0) + 1);
        });
      }
    });

    return Array.from(frameworkCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);
  }, [repos]);

  if (!open) return null;

  // Render export status message
  const renderExportStatus = () => {
    if (exportStatus === 'generating') {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <FiRefreshCw className="animate-spin" />
          <span>Generating PDF...</span>
        </div>
      );
    }
    
    if (exportStatus === 'success') {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <FiCheck className="text-xl" />
          <span>PDF generated successfully!</span>
        </div>
      );
    }
    
    if (exportStatus === 'error') {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <FiX className="text-xl" />
          <span>Failed to generate PDF. Please try again.</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col"
        style={{ color: "#1a1a1a" }}
      >
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Export Profile to PDF</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isExporting}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Configuration */}
          <div className="w-80 border-r p-6 overflow-y-auto">
            <ExportConfig
              config={exportConfig}
              onConfigChange={setExportConfig}
              onExport={handleExport}
              disabled={isExporting}
              repos={repos}
              selectedRepos={selectedRepos}
              onToggleRepo={toggleRepoSelection}
              onGenerateAiSummary={generateAiSummary}
              isGeneratingAi={isGeneratingAi}
            />
          </div>

          {/* Right Side - Preview */}
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div id="export-preview" className="p-8">
                <ExportPreview
                  config={exportConfig}
                  userProfile={{
                    ...userProfile,
                    bio:
                      userProfile.bio ||
                      "Full-stack developer passionate about building great user experiences.",
                  }}
                  stackSummary={{
                    languages: topLanguages,
                    topFrameworks: topFrameworks,
                    mostActiveTime:
                      new Date().getHours() < 12 ? "morning" : "afternoon",
                    stats: {
                      repositoryCount: repos.length,
                      totalCommits: repos.reduce((sum, repo) => {
                        // Use commit_count if available, otherwise fall back to watchers_count
                        const commitCount = repo.commit_count || repo.watchers_count || 0;
                        return sum + commitCount;
                      }, 0),
                      longestStreak: 0, // This would need to be calculated from commit history
                      totalStars: repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
                    }
                  }}
                  projects={projects}
                />
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
              <div>
                {exportStatus === "generating" && (
                  <span className="flex items-center">
                    <FiRefreshCw className="animate-spin mr-2" />
                    Generating PDF...
                  </span>
                )}
                {exportStatus === "success" && (
                  <span className="flex items-center text-green-600">
                    <FiCheck className="mr-2" />
                    PDF generated successfully!
                  </span>
                )}
                {exportStatus === "error" && (
                  <span className="text-red-600">
                    Error generating PDF. Please try again.
                  </span>
                )}
              </div>

              <div className="space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting || isGeneratingAi}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <FiRefreshCw className="animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FiDownload />
                      Export PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
