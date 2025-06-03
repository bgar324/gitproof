// components/ExportModal.tsx
"use client";
import { useState } from "react";
import ExportConfig from "./ExportConfig";
import ExportPreview from "./ExportPreview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ExportConfig as ExportConfigType } from "../types/export";
import { GitHubRepo } from "../types/github";

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
    maxProjects: 5,
    includeReadmeBullets: false,
    includeCommitHeatmap: false,
    includePieChart: false,
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById("export-preview");
    if (!element) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const imgData = canvas.toDataURL("image/png");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`${userProfile.name || "github"}-profile.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto" style={{ color: "#1a1a1a" }}>
        <div className="p-6 flex gap-8">
          <div className="w-80 flex-shrink-0">
            <ExportConfig
              onConfigChange={setExportConfig}
              onExport={handleExport}
              disabled={isExporting}
            />
          </div>
          <div className="flex-grow">
            <div className="bg-gray-100 p-8 rounded-lg">
              <div id="export-preview">
                <ExportPreview
                  config={exportConfig}
                  userProfile={userProfile}
                  stackSummary={{
                    languages: topLanguages,
                    topFrameworks: [],
                    mostActiveTime: "Not available",
                  }}
                  projects={repos.map((repo: GitHubRepo) => ({
                    name: repo.name,
                    summary: repo.description || "",
                    tags: [repo.language || ""].filter(Boolean),
                    bullets: [],
                    url: repo.html_url,
                    language: repo.language,
                    stars: repo.stargazers_count,
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
            disabled={isExporting}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
