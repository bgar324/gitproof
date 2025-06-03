"use client";

import { useEffect, useState } from "react";
import ReadmePreview from "./ReadmePreview";
import ReadmeStatus from "./ReadmeStatus";
import { marked } from "marked";
import { GitHubRepo } from "../../types/github";
import Image from "next/image";
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import { Sparkle } from "lucide-react";

function decodeBase64Utf8(base64: any) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

const getLanguageColor = (language: string | null): string => {
  if (!language) return "#94a3b8";
  const languageColors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    "C#": "#178600",
    PHP: "#4F5D95",
    Ruby: "#701516",
    Go: "#00ADD8",
    Rust: "#dea584",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    HTML: "#e34c26",
    CSS: "#563d7c",
    SCSS: "#c6538c",
    Shell: "#89e051",
    Dockerfile: "#384d54",
    Makefile: "#427819",
    Vue: "#41b883",
    React: "#61dafb",
    Angular: "#dd0031",
    Svelte: "#ff3e00",
  };
  if (languageColors[language]) {
    return languageColors[language];
  }
  let hash = 0;
  for (let i = 0; i < language.length; i++) {
    hash = language.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 65%)`;
};

interface RepoCardProps {
  repo: GitHubRepo;
  session: {
    accessToken?: string;
    user?: {
      login?: string;
    };
  } | null;
  accessToken?: string;
}

const StarIcon = () => (
  <div className="relative w-4 h-4">
    <Image src="/icons/star.svg" alt="Star" fill sizes="16px" />
  </div>
);

const GitForkIcon = () => (
  <div className="relative w-4 h-4">
    <Image src="/icons/fork.svg" alt="Fork" fill sizes="16px" />
  </div>
);

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function RepoCard({ repo, session }: RepoCardProps) {
  if (!session?.accessToken) return null;

  const summaryKey = `aiSummary:${repo.full_name}`;
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isReadmeLoading, setIsReadmeLoading] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [isReadmePreviewOpen, setIsReadmePreviewOpen] = useState(false);
  const wordCount = readmeContent ? readmeContent.split(/\s+/).length : 0;
  const charCount = readmeContent ? readmeContent.length : 0;
  const isReadmeTooShort = charCount < 100;
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [isLoadingLanguages, setIsLoadingLanguages] = useState<boolean>(false);
  const [isLoadingAiSummary, setIsLoadingAiSummary] = useState<boolean>(false);

  useEffect(() => {
    const fetchRepoData = async () => {
      if (!session?.accessToken) return;
      setIsReadmeLoading(true);
      setIsLoadingLanguages(true);
      try {
        const [readmeResponse, languagesResponse] = await Promise.all([
          fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/readme`,
            {
              headers: {
                Authorization: `token ${session.accessToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          ),
          fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/languages`,
            {
              headers: {
                Authorization: `token ${session.accessToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          ),
        ]);

        if (readmeResponse.ok) {
          const contentType = readmeResponse.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const readmeData = await readmeResponse.json();
            const decodedContent = decodeBase64Utf8(readmeData.content);
            setReadmeContent(decodedContent);
          } else {
            const rawMarkdown = await readmeResponse.text();
            setReadmeContent(rawMarkdown);
          }
        } else {
          setReadmeContent(null);
        }

        if (languagesResponse.ok) {
          const languagesData = await languagesResponse.json();
          setLanguages(languagesData);
        }
      } catch (error) {
        console.error("Error fetching repository data:", error);
        setReadmeContent(null);
      } finally {
        setIsReadmeLoading(false);
        setIsLoadingLanguages(false);
      }
    };

    fetchRepoData();
  }, [repo, session?.accessToken]);

  useEffect(() => {
    const cached = localStorage.getItem(summaryKey);
    if (cached) setAiSummary(cached);
    else setAiSummary("");
  }, [repo.full_name]);

  const getTopLanguages = (): { name: string; percent: number }[] => {
    if (Object.keys(languages).length === 0) {
      return repo.language ? [{ name: repo.language, percent: 100 }] : [];
    }
    const totalBytes = Object.values(languages).reduce(
      (sum, bytes) => sum + bytes,
      0
    );
    return Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        percent: Math.round((bytes / totalBytes) * 1000) / 10,
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);
  };

  const fetchAiSummary = async () => {
    const cached = localStorage.getItem(summaryKey);
    if (cached) {
      setAiSummary(cached);
      return;
    }
    setIsLoadingAiSummary(true);
    setAiSummary("");
    try {
      const langStats = Object.keys(languages).length
        ? languages
        : { [repo.language || "Unknown"]: 100 };

      const payload = {
        repoName: repo.name,
        description: repo.description || "A project.",
        languages: langStats,
        readme: (readmeContent || "")
          .replace(/[\u0000-\u001F]/g, "")
          .slice(0, 3000),
      };

      const aiApiRes = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!aiApiRes.ok) {
        setAiSummary(`Error: AI API responded with status ${aiApiRes.status}.`);
        return;
      }
      const data = await aiApiRes.json();
      if (data.summary) {
        setAiSummary(data.summary);
        localStorage.setItem(summaryKey, data.summary);
      } else if (data.error) {
        setAiSummary(`API Error: ${data.details || data.error}`);
      } else {
        setAiSummary("Received unexpected data from AI summary API.");
      }
    } catch (err) {
      setAiSummary("Failed to fetch AI summary due to an error.");
    } finally {
      setIsLoadingAiSummary(false);
    }
  };

  const clearAiSummaryCache = () => {
    localStorage.removeItem(summaryKey);
    setAiSummary("");
  };

  return (
    <div className="notion-card p-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                {repo.name}
              </a>
            </h3>
            <p className="text-gray-400 text-sm mt-1 italic">
              {repo.description || "No description"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <StarIcon />
              {repo.stargazers_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <GitForkIcon />
              {repo.forks_count.toLocaleString()}
            </span>
            {repo.language && (
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getLanguageColor(repo.language),
                  }}
                />
                <span>{repo.language}</span>
              </div>
            )}
            {isReadmeTooShort && (
              <button
                onClick={() => setIsReadmePreviewOpen(true)}
                className="text-amber-500 hover:text-amber-600 transition-colors cursor-help"
                title="This README is too short (under 100 characters). Click to generate a better one."
              >
                <FiAlertTriangle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sparkle/Trash under language row */}
        <div className="flex flex-row items-center gap-1 ml-auto" style={{ marginTop: -8, marginBottom: 0, minHeight: 0 }}>
          <button
            type="button"
            onClick={fetchAiSummary}
            disabled={isLoadingAiSummary}
            className="text-yellow-500 hover:text-yellow-600 transition-colors p-1 rounded focus:outline-none"
            title="Generate AI Summary"
          >
            <Sparkle className={`w-4 h-4 ${isLoadingAiSummary ? "animate-spin" : ""}`} />
          </button>
          {aiSummary && (
            <button
              type="button"
              onClick={clearAiSummaryCache}
              className="text-gray-400 hover:text-red-500 p-1 rounded focus:outline-none"
              title="Clear AI Summary Cache"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isLoadingLanguages ? (
              <span className="text-xs text-gray-400">
                Loading languages...
              </span>
            ) : Object.keys(languages).length > 0 ? (
              getTopLanguages().map(({ name, percent }) => (
                <span
                  key={name}
                  className="flex items-center gap-1"
                  title={`${name} (${percent}%)`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getLanguageColor(name),
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                    }}
                  ></span>
                  <span className="text-xs">
                    {name} {percent}%
                  </span>
                </span>
              ))
            ) : repo.language ? (
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: getLanguageColor(repo.language),
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                  }}
                  title={repo.language}
                ></span>
                <span className="text-xs">{repo.language}</span>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Updated: {formatDate(repo.updated_at)}</span>
            <span>•</span>
            <span>Created: {formatDate(repo.created_at)}</span>
          </div>
        </div>

        {/* AI Summary */}
        {isLoadingAiSummary ? (
          <div className="text-gray-500 text-sm mt-4">
            Generating AI summary...
          </div>
        ) : aiSummary ? (
          <div className="prose prose-sm max-w-none border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-2">AI Summary ✨</h4>
            <p className="text-gray-600">{aiSummary}</p>
          </div>
        ) : null}

        {/* README Section */}
        {readmeContent && (
          <div className="border border-gray-100 bg-gray-50 rounded-lg p-3 mt-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-gray-800">README.md</h4>
              <button
                onClick={() => setIsReadmePreviewOpen(!isReadmePreviewOpen)}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white transition-colors"
              >
                {isReadmePreviewOpen ? "Hide" : "View"}
                <svg
                  className={`w-3 h-3 transition-transform ${
                    isReadmePreviewOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {isReadmePreviewOpen && (
              <div className="bg-white rounded-md p-4 overflow-auto max-h-96 border border-gray-100 shadow-inner">
                <ReadmePreview content={readmeContent} className="text-sm" />
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <ReadmeStatus
                readmeContent={readmeContent}
                repoName={repo.name}
                description={repo.description || ""}
                languages={languages}
                repoUrl={repo.html_url}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
