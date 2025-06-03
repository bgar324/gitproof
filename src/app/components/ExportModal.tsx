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
    includeCommitHeatmap: true,
    includePieChart: true,
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
      // Create a new PDF with better formatting
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Get the dimensions of the page
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Calculate scale factor for better quality
      const scale = 2; // Higher scale for better quality
      const width = element.offsetWidth;
      const height = element.offsetHeight;

      // Create a canvas with higher resolution
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      // Set canvas style dimensions to maintain size
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Get 2D context and scale it
      const context = canvas.getContext("2d");
      if (context) {
        context.scale(scale, scale);
      }

      // Render to canvas with type assertion for html2canvas options
      await html2canvas(element, {
        canvas,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollY: -window.scrollY,
        allowTaint: true,
        imageTimeout: 0,
        width,
        height,
        x: 0,
        y: 0,
        scale: 1, // We're handling scaling manually
      } as any); // Type assertion to bypass type checking for html2canvas options

      // Calculate dimensions to maintain aspect ratio
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - 20; // Add margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add the image to the PDF
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

      // Save the PDF
      pdf.save(
        `${
          userProfile.name?.replace(/\s+/g, "-").toLowerCase() || "github"
        }-profile.pdf`
      );
      setExportStatus("success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      setExportStatus("error");
    } finally {
      setIsExporting(false);
      // Reset status after 3 seconds
      setTimeout(() => setExportStatus("idle"), 3000);
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
        summary: repo.description || "",
        tags: [repo.language, ...(repo.topics || [])].filter(
          Boolean
        ) as string[],
        bullets: aiSummaries[repo.name] ? [aiSummaries[repo.name]] : [],
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        hasReadme: true,
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
