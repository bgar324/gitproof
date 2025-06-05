"use client";

import { useState, useEffect } from "react";
import { GitHubRepo } from "@/types/github";
import { Session } from "next-auth";

interface QuickProfileSummaryProps {
  repos: GitHubRepo[];
  created_at: string;
  languages: Record<string, number>;
  totalStars: number;
  totalForks: number;
  // session: Session | null;
}

export default function QuickProfileSummary({
  repos,
  created_at,
  languages,
  totalStars,
  totalForks,
  // session,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, created_at]);

  if (loading && !summary) {
    return (
      <div className="bg-white rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Calculate years on GitHub
  const yearsOnGitHub = created_at
    ? new Date().getFullYear() - new Date(created_at).getFullYear()
    : 0;

  // Calculate other metrics
  const totalCommits = repos.reduce(
    (sum, repo) => sum + (repo.commit_count || 0),
    0
  );

  // Calculate average repo size in KB
  const totalSizeKB = repos.reduce((sum, repo) => sum + (repo.size || 0), 0);
  const avgRepoSizeKB =
    repos.length > 0 ? Math.round(totalSizeKB / repos.length) : 0;

  // Count active repos (updated in last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const activeRepos = repos.filter(
    (repo) => repo.pushed_at && new Date(repo.pushed_at) > sixMonthsAgo
  ).length;

  // Stats Grid
  const stats = [
    { label: "Total Repositories", value: repos.length },
    { label: "Total Stars", value: totalStars },
    { label: "Total Forks", value: totalForks },
    { label: "Total Commits", value: totalCommits },
    { label: "Years on GitHub", value: yearsOnGitHub },
    { label: "Active Repos (6m)", value: activeRepos },
    { label: "Avg Repo Size", value: `${avgRepoSizeKB} KB` },
    { label: "Languages Used", value: Object.keys(languages).length },
  ];

  // Responsive grid columns
  const gridCols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  const statCardClasses =
    "notion-card p-4 sm:p-6 flex flex-col justify-between";
  const statValueClasses = "text-xl sm:text-2xl font-semibold truncate";
  const statLabelClasses =
    "text-xs sm:text-sm font-medium text-gray-500 truncate";

  // Top languages
  const topLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className={`grid ${gridCols} gap-6`}>
        {stats.map((stat, index) => (
          <div key={index} className={statCardClasses}>
            <h4 className={statLabelClasses}>{stat.label}</h4>
            <p className={statValueClasses}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Quick Profile Summary Card */}
      <div className="notion-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            Quick Profile Summary ✨
          </h4>
          {summary ? (
            <button
              onClick={() => {
                localStorage.removeItem("quickProfileSummary");
                setSummary("");
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors duration-200 hover:shadow-sm"
              title="Clear cached summary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Clear Cache</span>
            </button>
          ) : null}
        </div>
        {summary ? (
          <p className="text-gray-600">{summary}</p>
        ) : (
          <div className="flex justify-between items-center">
            <div></div> {/* Empty div to balance the flex layout */}
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch("/api/ai/quick-summary", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ repos, created_at }),
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setSummary(data.summary);
                    localStorage.setItem("quickProfileSummary", data.summary);
                  }
                } catch (e) {}
                setLoading(false);
              }}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 flex items-center gap-2 text-sm font-medium transition-colors duration-200 hover:shadow-sm font-reckless"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                "Generate Insights"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
