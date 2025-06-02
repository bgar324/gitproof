// RepoCard.tsx
"use client";

import { useEffect, useState } from "react";
import ReadmePreview from "./ReadmePreview";
import { marked } from "marked";
import { GitHubRepo } from "../types/github";
import Image from "next/image";

// Function to generate a consistent color based on language name
const getLanguageColor = (language: string | null): string => {
  if (!language) return '#94a3b8'; // Default gray color for unknown languages
  
  // Common languages with their GitHub colors
  const languageColors: Record<string, string> = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C#': '#178600',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'Swift': '#F05138',
    'Kotlin': '#A97BFF',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'SCSS': '#c6538c',
    'Shell': '#89e051',
    'Dockerfile': '#384d54',
    'Makefile': '#427819',
    'Vue': '#41b883',
    'React': '#61dafb',
    'Angular': '#dd0031',
    'Svelte': '#ff3e00',
  };

  // If we have a defined color, use it
  if (languageColors[language]) {
    return languageColors[language];
  }

  // Otherwise, generate a consistent color from the language name
  let hash = 0;
  for (let i = 0; i < language.length; i++) {
    hash = language.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a pastel color using HSL
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

interface LanguageStats {
  [key: string]: number;
}

export default function RepoCard({ repo, session }: RepoCardProps) {
  if (!session?.accessToken) return null;
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isLoadingAiSummary, setIsLoadingAiSummary] = useState<boolean>(false);
  const [languages, setLanguages] = useState<LanguageStats>({});
  const [isLoadingLanguages, setIsLoadingLanguages] = useState<boolean>(false);

  // Fetch repository languages
  useEffect(() => {
    const fetchLanguages = async () => {
      if (!session?.accessToken) return;
      
      setIsLoadingLanguages(true);
      try {
        const response = await fetch(
          `https://api.github.com/repos/${repo.full_name}/languages`,
          {
            headers: {
              'Authorization': `token ${session.accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setLanguages(data);
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
      } finally {
        setIsLoadingLanguages(false);
      }
    };
    
    fetchLanguages();
  }, [repo.full_name, session?.accessToken]);

  // Get top 3 languages with their percentages
  const getTopLanguages = (): {name: string, percent: number}[] => {
    if (Object.keys(languages).length === 0) {
      // Fallback to the primary language if no language data is available
      return repo.language ? [{ name: repo.language, percent: 100 }] : [];
    }
    
    const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    
    return Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        percent: Math.round((bytes / totalBytes) * 1000) / 10 // Keep one decimal place
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3); // Get top 3 languages
  };

  useEffect(() => {
    const fetchAndSetAiSummary = async () => {
      if (repo.name === "mtsaccs-v2") {
        // Your specific condition
        setIsLoadingAiSummary(true);
        setAiSummary("");
        console.log(`REPO_CARD (${repo.name}): Checking for AI summary.`);
        let readmeContent = ""; // Initialize here to ensure it's always available

        try {
          const readmeUrl = `https://api.github.com/repos/${repo.full_name}/readme`;
          console.log(
            `REPO_CARD (${repo.name}): Fetching README info from GitHub: ${readmeUrl}`
          );

          const readmeRes = await fetch(readmeUrl, {
            headers: {
              // Explicitly ask for JSON. GitHub API v3 usually defaults to this for this endpoint.
              Accept: "application/vnd.github.v3+json, application/json",
            },
          });

          let rawMarkdownText = "";

          if (!readmeRes.ok) {
            console.warn(
              `REPO_CARD (${repo.name}): GitHub API error for README metadata. Status: ${readmeRes.status} ${readmeRes.statusText}`
            );
            try {
              const ghErrorBody = await readmeRes.text();
              console.warn(
                `REPO_CARD (${
                  repo.name
                }): GitHub error body: ${ghErrorBody.substring(0, 200)}`
              );
            } catch (e) {
              /* ignore */
            }
          } else {
            const githubResponseClone = readmeRes.clone(); // Clone for potential re-read
            let readmeApiData;
            try {
              readmeApiData = await readmeRes.json(); // Try to parse as JSON (expected behavior)
              console.log(
                `REPO_CARD (${repo.name}): Successfully parsed GitHub README metadata as JSON.`
              );
              const downloadUrl = readmeApiData.download_url;

              if (downloadUrl) {
                console.log(
                  `REPO_CARD (${repo.name}): Fetching raw README content from download_url: ${downloadUrl}`
                );
                const rawContentRes = await fetch(downloadUrl);
                if (rawContentRes.ok) {
                  rawMarkdownText = await rawContentRes.text();
                } else {
                  console.warn(
                    `REPO_CARD (${repo.name}): Failed to fetch raw README from download_url. Status: ${rawContentRes.status}`
                  );
                }
              } else {
                console.warn(
                  `REPO_CARD (${repo.name}): download_url not found in GitHub README metadata. This is unexpected if JSON parsing succeeded.`
                );
                // As a fallback, if JSON was parsed but no download_url, maybe the original response was text?
                // This case is less likely if the above json() succeeded without error.
                rawMarkdownText = await githubResponseClone.text();
                console.log(
                  `REPO_CARD (${repo.name}): Used cloned initial response as raw markdown due to missing download_url.`
                );
              }
            } catch (jsonParseError) {
              // jsonParseError is 'unknown'
              // THIS IS THE PATH CURRENTLY BEING HIT
              let errorMessage =
                "An unknown error occurred during JSON parsing.";
              if (jsonParseError instanceof Error) {
                errorMessage = jsonParseError.message;
              } else if (typeof jsonParseError === "string") {
                errorMessage = jsonParseError;
              }

              console.warn(
                `REPO_CARD (${repo.name}): Could not parse GitHub response from ${readmeUrl} as JSON. Assuming it's raw Markdown content. Error: ${errorMessage}`
              );
              // The response body itself is likely the raw markdown.
              // Ensure githubResponseClone is still in scope and valid if this path is hit.
              // It should be, as it was defined before this try-catch for readmeRes.json().
              rawMarkdownText = await githubResponseClone.text(); // Re-read from clone
            }
          }

          if (rawMarkdownText) {
            console.log(
              `REPO_CARD (${repo.name}): Raw Markdown fetched (length: ${rawMarkdownText.length}). Cleaning...`
            );
            readmeContent = (await marked.parse(rawMarkdownText))
              .replace(/<[^>]+>/g, "") // Remove HTML tags
              .replace(/\s\s+/g, " ") // Replace multiple spaces/newlines with single space
              .trim();
            console.log(
              `REPO_CARD (${repo.name}): Cleaned README content length:`,
              readmeContent.length
            );
          } else {
            console.warn(
              `REPO_CARD (${repo.name}): No raw markdown content was successfully obtained for README.`
            );
          }

          // --- Proceed to fetch AI summary ---
          console.log(
            `REPO_CARD (${repo.name}): Preparing payload for AI summary API.`
          );
          const payload = {
            repoName: repo.name,
            description: repo.description || "A project.",
            languages: { [repo.language || "Unknown"]: 100 }, // Adjust as needed
            readme: readmeContent
              .replace(/[\u0000-\u001F]/g, "")
              .slice(0, 3000), // Increased slice limit slightly
          };
          console.log(
            `REPO_CARD (${repo.name}): Sending payload (README snippet):`,
            {
              ...payload,
              readme: payload.readme.substring(0, 100) + "...",
            }
          );

          const aiApiRes = await fetch("/api/ai/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!aiApiRes.ok) {
            console.error(
              `REPO_CARD (${repo.name}): AI summary API error status:`,
              aiApiRes.status,
              aiApiRes.statusText
            );
            let errorBody = "Could not retrieve error body.";
            try {
              errorBody = await aiApiRes.text();
            } catch (e) {
              /* ignore */
            }
            console.error(
              `REPO_CARD (${repo.name}): AI summary API error body:`,
              errorBody
            );
            setAiSummary(
              `Error: AI API responded with status ${aiApiRes.status}.`
            );
          } else {
            const aiApiResponseClone = aiApiRes.clone();
            const rawAiApiResponseText = await aiApiResponseClone.text();
            console.log(
              `REPO_CARD (${repo.name}): RAW AI API RESPONSE for summary:`,
              rawAiApiResponseText
            );
            try {
              const data = await aiApiRes.json();
              if (data.summary) {
                setAiSummary(data.summary);
              } else if (data.error) {
                setAiSummary(`API Error: ${data.details || data.error}`);
              } else {
                setAiSummary("Received unexpected data from AI summary API.");
              }
            } catch (aiJsonParseError) {
              setAiSummary(
                "Error: Could not parse AI API response. Raw: " +
                  rawAiApiResponseText.substring(0, 70) +
                  "..."
              );
            }
          }
        } catch (error) {
          console.error(
            `REPO_CARD (${repo.name}): General unexpected error in fetchAndSetAiSummary:`,
            error
          );
          setAiSummary(
            "Failed to fetch AI summary due to a critical unexpected error."
          );
        } finally {
          setIsLoadingAiSummary(false);
        }
      } else {
        setAiSummary("");
        setIsLoadingAiSummary(false);
      }
    };

    fetchAndSetAiSummary();
  }, [repo.name, repo.description, repo.full_name, repo.language]); // Ensure dependencies are correct

  // --- JSX for rendering ---
  let summaryDisplay = aiSummary;
  return (
    <div className="notion-card p-6">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                {repo.name}
              </a>
            </h3>
            {repo.description && (
              <p className="text-gray-600 text-sm">{repo.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <StarIcon />
              {repo.stargazers_count}
            </span>
            <span className="flex items-center gap-1">
              <GitForkIcon />
              {repo.forks_count}
            </span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2 flex-wrap">
            {isLoadingLanguages ? (
              <span className="text-xs text-gray-400">Loading languages...</span>
            ) : getTopLanguages().length > 0 ? (
              getTopLanguages().map(({ name, percent }) => (
                <span key={name} className="flex items-center gap-1" title={`${name} (${percent}%)`}>
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ 
                      backgroundColor: getLanguageColor(name),
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                    }}
                  ></span>
                  <span className="text-xs">{name} {percent}%</span>
                </span>
              ))
            ) : repo.language ? (
              <span className="flex items-center gap-1">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ 
                    backgroundColor: getLanguageColor(repo.language),
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
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
          <div className="text-gray-500 text-sm">Generating AI summary...</div>
        ) : aiSummary ? (
          <div className="prose prose-sm max-w-none border-t pt-4">
            <h4 className="text-sm font-medium mb-2">AI Summary ✨</h4>
            <p className="text-gray-600">{aiSummary}</p>
          </div>
        ) : null}

        {/* README Preview */}
        <div className="border-t pt-4">
          <ReadmePreview
            owner={repo.owner.login}
            repo={repo.name}
            accessToken={session.accessToken}
            className="prose prose-sm max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
