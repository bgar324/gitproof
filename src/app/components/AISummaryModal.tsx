"use client";

import { useState, useCallback, useEffect } from "react";
import { FiX, FiRefreshCw } from "react-icons/fi";
import { GitHubRepo } from "@/types/github";

interface AISummaryModalProps {
  open: boolean;
  onClose: () => void;
  repos: GitHubRepo[];            // ← full list of repos
  userProfile: {
    name: string;
    login: string;
  };
  onSummaryGenerated?: (summary: string) => void;
  cachedSummary?: string;
}

const AISummaryModal: React.FC<AISummaryModalProps> = ({
  open,
  onClose,
  repos,                        // ← no more selectedRepos
  userProfile,
  onSummaryGenerated,
  cachedSummary,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(cachedSummary || "");
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useCallback(async () => {
    if (!repos.length) {
      setError("No repositories available to summarize");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/pdf-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repos,                            // ← send full list
          createdAt: new Date().toISOString(),
          name: userProfile.name || userProfile.login,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newSummary = data.summary || "";
        setSummary(newSummary);
        onSummaryGenerated?.(newSummary);
      } else if (response.status === 403) {
        throw new Error("GitHub API rate limit exceeded. Please try again later.");
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate summary");
      }
    } catch (err) {
      console.error("Error generating AI summary:", err);
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  }, [repos, userProfile, onSummaryGenerated]);

  // When the modal opens, auto-generate (unless we already have a cachedSummary)
  useEffect(() => {
    if (open && !cachedSummary) {
      generateSummary();
    }
  }, [open, cachedSummary, generateSummary]);

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">AI Developer Summary</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Using {repos.length} repositories
            </span>
            <button
              onClick={generateSummary}
              disabled={isGenerating || !repos.length}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FiRefreshCw />
                  Regenerate
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Generated Summary
            </h3>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">
              {summary || "No summary generated yet"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISummaryModal;
