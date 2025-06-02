"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import ExportConfig from "../components/ExportConfig";
import ExportPreview from "../components/ExportPreview";
import RepoCard from "../components/RepoCard";
import { GitHubRepo } from "../types/github";
import { ExportConfig as ExportConfigType } from "../types/export";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AiInsights from "../components/AiInsights";
import QuickProfileSummary from "../components/QuickProfileSummary";
import Sidebar from "../components/Sidebar";
import GitHubSignIn from "../components/GitHubSignIn";

type GitHubStats = {
  repos: GitHubRepo[];
  totalStars: number;
  totalForks: number;
  languages: Record<string, number>;
  topLanguages: { name: string; percentage: number }[];
  totalContributions: number;
  commitActivity: Record<string, number>;
};

const LoadingOrSplash = ({
  message,
  showBack,
}: {
  message: string;
  showBack?: boolean;
}) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    <img
      src="/gitprooflogo.png"
      alt="GitProof Logo"
      className="w-16 h-16 mb-6 animate-spin"
      style={{ animationDuration: "2s" }}
    />
    <p className="text-lg text-gray-700 mb-4">{message}</p>
    {showBack && (
      <Link
        href="/"
        className="inline-block mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-900 transition text-sm w-fit font-reckless"
      >
        Back to Safety
      </Link>
    )}
  </div>
);

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GitHubStats>({
    repos: [],
    totalStars: 0,
    totalForks: 0,
    languages: {},
    topLanguages: [],
    totalContributions: 0,
    commitActivity: {},
  });
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [showExport, setShowExport] = useState(false);
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

  const handleExport = async () => {
    if (!exportConfig) return;
    const element = document.getElementById("export-preview");
    if (!element) return;

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
      pdf.save(`${session?.user?.name || "github"}-profile.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  useEffect(() => {
    const fetchGitHubData = async () => {
      if (!session?.accessToken) return;
      setLoading(true);

      try {
        const reposResponse = await fetch(
          "https://api.github.com/user/repos?per_page=100&sort=updated",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );
        const repos = await reposResponse.json();

        const reposWithDetails = await Promise.all(
          repos.map(async (repo: GitHubRepo) => {
            try {
              const commitsResponse = await fetch(
                `https://api.github.com/repos/${repo.full_name}/commits?per_page=1`,
                {
                  headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                  },
                }
              );
              const commitCount = parseInt(
                commitsResponse.headers
                  .get("link")
                  ?.match(/page=([0-9]+)>; rel="last"/)
                  ?.at(1) || "0"
              );

              const contributorsResponse = await fetch(
                `https://api.github.com/repos/${repo.full_name}/contributors?per_page=1`,
                {
                  headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                  },
                }
              );
              const contributorsCount = parseInt(
                contributorsResponse.headers
                  .get("link")
                  ?.match(/page=([0-9]+)>; rel="last"/)
                  ?.at(1) || "1"
              );

              const readmeResponse = await fetch(
                `https://api.github.com/repos/${repo.full_name}/readme`,
                {
                  headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                  },
                }
              );
              const hasReadme = readmeResponse.status === 200;

              return {
                ...repo,
                commit_count: commitCount,
                contributors_count: contributorsCount,
                has_readme: hasReadme,
              };
            } catch (error) {
              console.error(`Error fetching details for ${repo.name}:`, error);
              return repo;
            }
          })
        );

        const languages: Record<string, number> = {};
        let totalStars = 0;
        let totalForks = 0;

        reposWithDetails.forEach((repo) => {
          if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
          }
          totalStars += repo.stargazers_count || 0;
          totalForks += repo.forks_count || 0;
        });

        const totalRepos = Object.values(languages).reduce(
          (a: number, b: number) => a + b,
          0
        );
        const topLanguages = Object.entries(languages)
          .map(([name, count]) => ({
            name,
            percentage: Math.round((count / totalRepos) * 100),
          }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5);

        setStats({
          repos: reposWithDetails,
          totalStars,
          totalForks,
          languages,
          topLanguages,
          totalContributions: repos.length,
          commitActivity: {},
        });
      } catch (error) {
        console.error("Error fetching GitHub data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [session?.accessToken]);

  if (!session)
    return (
      <LoadingOrSplash
        message="Please sign in to view your dashboard"
        showBack={true}
      />
    );
  if (loading)
    return <LoadingOrSplash message="Analyzing your GitHub profile..." />;

  const languageStats = stats.repos
    .filter((repo) => repo.language)
    .reduce<Record<string, number>>((acc, repo) => {
      if (repo.language) {
        acc[repo.language] = (acc[repo.language] || 0) + 1;
      }
      return acc;
    }, {});

  const mostUsedLanguage =
    Object.entries(languageStats).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "N/A";

  return (
    <div className="flex min-h-screen overflow-hidden">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-y-auto h-screen px-6 py-2">
        <div className="notion-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  className="w-16 h-16 rounded-full object-cover"
                  style={{
                    width: "40px",
                    height: "40px",
                    minWidth: "40px",
                    minHeight: "40px",
                    maxWidth: "40px",
                    maxHeight: "40px",
                  }}
                />
              )}
              <div>
                <h2 className="text-xl font-semibold font-reckless">
                  {session?.user?.name}
                </h2>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setShowExport(true)}
              className="text-sm font-medium bg-black text-white px-4 py-2 rounded hidden sm:block hover:bg-black/90 duration-200 ease-in-out transition font-reckless"
            >
              Export PDF
            </button>
          </div>
        </div>
        {session?.user?.createdAt && (
          <div className="space-y-6">
            <div id="summary" className="notion-card p-6">
              <h3 className="text-3xl font-semibold font-reckless mb-4 flex items-center gap-2">
                Profile Summary
              </h3>
              <QuickProfileSummary
                repos={stats.repos}
                createdAt={session.user.createdAt}
                languages={stats.languages}
                totalStars={stats.totalStars}
                totalForks={stats.totalForks}
              />
            </div>
            <div id="ai-insights" className="notion-card p-6 px-8">
              <AiInsights
                repos={stats.repos}
                createdAt={session.user.createdAt}
              />
            </div>
          </div>
        )}
        <div id="archive" className="notion-card flex flex-col mt-6 p-6">
          <h2 className="text-3xl font-semibold font-reckless">
            Repository Archive
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
            {stats.repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                session={{ accessToken: session?.accessToken }}
              />
            ))}
          </div>
        </div>
      </div>
      {showExport && exportConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto"
            style={{ color: "#1a1a1a" }}
          >
            <div className="p-6 flex gap-8">
              <div className="w-80 flex-shrink-0">
                <ExportConfig
                  onConfigChange={setExportConfig}
                  onExport={handleExport}
                />
              </div>
              <div className="flex-grow">
                <div className="bg-gray-100 p-8 rounded-lg">
                  <div id="export-preview">
                    <ExportPreview
                      config={exportConfig}
                      userProfile={{
                        name: session?.user?.name || "",
                        avatarUrl: session?.user?.image || "",
                        githubUrl: `https://github.com/${session?.user?.name}`,
                        bio: null,
                      }}
                      stackSummary={{
                        languages: stats.topLanguages,
                        topFrameworks: [],
                        mostActiveTime: "Not available",
                      }}
                      projects={stats.repos.map((repo: GitHubRepo) => ({
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
                onClick={() => setShowExport(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
