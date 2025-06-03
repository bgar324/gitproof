"use client";

import { useState, useEffect } from "react";
import { GitHubRepo } from "../../types/github";

interface QuickProfileSummaryProps {
  repos: GitHubRepo[];
  created_at: string;
  languages: Record<string, number>;
  totalStars: number;
  totalForks: number;
}

export default function QuickProfileSummary({
  repos,
  created_at,
  languages,
  totalStars,
  totalForks,
}: QuickProfileSummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCachedSummary = () => {
      const cached = localStorage.getItem("quickProfileSummary");
      if (cached) {
        setSummary(cached);
        return true;
      }
      return false;
    };

    const generateSummary = async () => {
      if (loadCachedSummary()) return;
      setLoading(true);

      try {
        const response = await fetch("/api/ai/quick-summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ repos, created_at }),
        });

        if (response.ok) {
          const data = await response.json();
          setSummary(data.summary);
          localStorage.setItem("quickProfileSummary", data.summary);
        }
      } catch (error) {
        console.error("Error generating quick summary:", error);
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [repos, created_at]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="notion-card p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            Total Repositories
          </h4>
          <p className="text-2xl font-semibold">{repos.length}</p>
        </div>
        <div className="notion-card p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            Total Stars
          </h4>
          <p className="text-2xl font-semibold">{totalStars}</p>
        </div>
        <div className="notion-card p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            Total Forks
          </h4>
          <p className="text-2xl font-semibold">{totalForks}</p>
        </div>
      </div>

      {/* Languages */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* <div className="notion-card p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Top Languages
          </h4>
          <div className="space-y-2">
            {Object.entries(languages)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([lang, count]) => (
                <div key={lang} className="flex items-center justify-between">
                  <span>{lang}</span>
                  <span className="text-sm text-gray-500">{count} repos</span>
                </div>
              ))}
          </div>
        </div> */}
        <div className="notion-card p-6">
          <h4 className="text-lg font-semibold mb-4">Top Languages</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(languages)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([lang, count]) => (
                <span key={lang} className="tech-pill">
                  {lang}
                  <span className="ml-1 text-gray-500">({count})</span>
                </span>
              ))}
          </div>
        </div>

        {/* Most Used Language */}
        <div className="notion-card p-6">
          <h4 className="text-lg font-semibold mb-4">Most Used Language</h4>
          {Object.entries(languages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 1)
            .map(([lang, count]) => (
              <div key={lang} className="text-center">
                <div className="text-4xl font-bold mb-2">{lang}</div>
                <div className="text-sm text-gray-500">
                  Used in {count} {count === 1 ? "repository" : "repositories"}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Summary */}
      <div className="notion-card p-6">
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Quick Profile Summary ✨
        </h4>
        <p className="text-gray-600">{summary}</p>
      </div>
    </div>
  );
}
