"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import RepoCard from "../components/RepoCard";
import AiInsights from "../components/AiInsights";
import QuickProfileSummary from "../components/QuickProfileSummary";
import Sidebar from "../components/Sidebar";
import ExportModal from "../components/ExportModal";
import { GitHubRepo } from "../../types/github";

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
  const [showExport, setShowExport] = useState(false);

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

  return (
    <div className="flex min-h-screen overflow-hidden">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-y-auto h-screen px-12 py-6">
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
        {session?.user?.created_at && (
          <div className="space-y-6">
            <div id="summary" className="notion-card p-6">
              <h3 className="text-3xl font-semibold font-reckless mb-4 flex items-center gap-2">
                Profile Summary
              </h3>
              <QuickProfileSummary
                repos={stats.repos}
                created_at={session.user.created_at}
                languages={stats.languages}
                totalStars={stats.totalStars}
                totalForks={stats.totalForks}
              />
            </div>
            <div id="ai-insights" className="notion-card p-6 px-8">
              <AiInsights
                repos={stats.repos}
                created_at={session.user.created_at}
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
      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        userProfile={{
          name: session?.user?.name || "",
          avatar_url: session?.user?.image || "",
          html_url:
            session?.user?.html_url ||
            `https://github.com/${session?.user?.name}`,
          bio: null,
          login: session?.user?.name || "",
        }}
        repos={stats.repos}
        topLanguages={stats.topLanguages}
      />
    </div>
  );
}
