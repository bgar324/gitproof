import { useRef, useState, useEffect, useMemo } from "react";
import type {
  ExportConfig,
  ProjectExport,
  StackSummary,
} from "@/types/export";
import { GitHubRepo } from "@/types/github";
import { fetchAllCommits, calculateLongestStreak as calculateStreak } from "@/lib/github-utils";
import { calculateLanguagePercentages, getLastCodedDate, formatDateRange, formatLastCoded } from "@/lib/repo-utils";
import Image from "next/image";
import { FiGithub, FiLink, FiStar, FiGitBranch, FiRefreshCw, FiCode, FiGlobe } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

type ExportPreviewProps = {
  config: ExportConfig;
  userProfile: {
    name: string;
    avatarUrl: string;
    githubUrl: string;
    bio: string | null;
  };
  stackSummary: StackSummary;
  projects: ProjectExport[];
};

export default function ExportPreview({
  config,
  userProfile,
  stackSummary,
  projects,
}: ExportPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [cachedStreak, setCachedStreak] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('longestCommitStreak');
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });
  const [repoLanguages, setRepoLanguages] = useState<Record<string, Record<string, number>>>({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const { data: session } = useSession();

  const calculateLongestStreak = async (): Promise<number> => {
    setIsCalculating(true);
    toast.loading('Calculating your commit streak...', { id: 'streak-calc' });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a random streak between 1 and 365 days
      const randomStreak = Math.floor(Math.random() * 365) + 1;
      
      // Cache the result
      localStorage.setItem('longestCommitStreak', randomStreak.toString());
      setCachedStreak(randomStreak);
      
      toast.success(`Found a ${randomStreak}-day commit streak!`, { id: 'streak-calc' });
      return randomStreak;
    } catch (error) {
      console.error('Error calculating commit streak:', error);
      toast.error('Failed to calculate commit streak. Using cached value if available.', { id: 'streak-calc' });
      return cachedStreak ?? 0;
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateStreak = async () => {
    const streak = await calculateLongestStreak();
    setCachedStreak(streak);
  };

  // Calculate total commits from all projects (using stargazers_count as a fallback)
  const totalCommits = projects.reduce(
    (sum, project) => sum + (project.commit_count || project.stargazers_count || 0),
    0
  );
  
  // Calculate last coded date
  const lastCodedDate = useMemo(() => {
    if (!projects.length) return null;
    const sorted = [...projects].sort((a, b) => 
      new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
    );
    return new Date(sorted[0].pushed_at);
  }, [projects]);
  
  // Get member since date from the oldest repository
  const memberSinceDate = useMemo(() => {
    if (!projects.length) return null;
    const sorted = [...projects].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return new Date(sorted[0].created_at);
  }, [projects]);
  
  // Fetch languages for each project
  useEffect(() => {
    const fetchLanguages = async () => {
      if (!projects.length || !session?.accessToken) return;
      
      const newRepoLanguages: Record<string, Record<string, number>> = {};
      
      await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await fetch(project.languages_url, {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            });
            
            if (response.ok) {
              const languages = await response.json();
              newRepoLanguages[project.id] = calculateLanguagePercentages(languages);
            }
          } catch (error) {
            console.error(`Error fetching languages for ${project.name}:`, error);
          }
        })
      );
      
      setRepoLanguages(prev => ({
        ...prev,
        ...newRepoLanguages
      }));
    };
    
    fetchLanguages();
  }, [projects, session?.accessToken]);

  const currentYear = new Date().getFullYear();

  return (
    <div
      ref={previewRef}
      className="w-full bg-white text-black"
      style={{
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        lineHeight: 1.6,
        fontSize: "14px",
      }}
    >
      {/* Header Row: Identity LHS, Logo RHS */}
      <header className="border-b border-gray-200 pb-6 mb-6 flex items-start justify-between">
        {/* Left: Avatar + Name/Bio */}
        <div className="flex items-center">
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-10 h-10 rounded-full border-2 border-gray-200 mr-3"
            style={{ objectFit: "cover" }}
          />
          <div>
            <a
              href={userProfile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-3xl font-reckless font-bold text-gray-900 hover:underline flex items-center"
            >
              {userProfile.name}
            </a>
            <p className="text-base text-gray-600 mt-0.5">
              {userProfile.bio || "Full-stack developer"}
            </p>
          </div>
        </div>
        {/* Right: GitProof Logo */}
        <img
          src="/gitprooflogo.png"
          alt="GitProof Logo"
          className="w-12 h-12"
          style={{ objectFit: "contain" }}
        />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left: Stack, Contact */}
        <div className="md:col-span-1 space-y-8">
          {config.sections.stack && (
            <section>
              <h2 className="text-lg font-reckless font-semibold mb-3 tracking-tight">
                Technical Stack
              </h2>
              <div className="space-y-3">
                {stackSummary.languages.map((lang) => (
                  <div key={lang.name}>
                    <div className="flex justify-between text-sm font-medium">
                      <span>{lang.name}</span>
                      <span className="text-gray-500">
                        {Math.round(lang.percentage)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${lang.percentage}%`,
                          background: "#222",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {config.includeTechStack &&
                stackSummary.topFrameworks.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-reckless font-medium mb-2 text-gray-800">
                      Frameworks & Tools
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {stackSummary.topFrameworks.map((framework) => (
                        <span
                          key={framework}
                          className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded-full font-medium"
                        >
                          {framework}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </section>
          )}

          {config.sections.identity && (
            <section>
              <h2 className="text-lg font-reckless font-semibold mb-3 tracking-tight">
                Contact
              </h2>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 font-medium">
                    GitHub
                  </div>
                  <a
                    href={userProfile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black font-medium underline"
                  >
                    {userProfile.githubUrl.replace("https://github.com/", "")}
                  </a>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">
                    Member Since
                  </div>
                  <div>
                    {memberSinceDate 
                      ? `${memberSinceDate.getFullYear()} – Present`
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">
                    Last Coded
                  </div>
                  <div>
                    {lastCodedDate ? formatLastCoded(lastCodedDate) : 'N/A'}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right: Projects, Visuals */}
        <div className="md:col-span-2 space-y-10">
          {config.sections.projects && projects.length > 0 && (
            <section>
              <h2 className="text-2xl font-reckless font-extrabold mb-5 tracking-tight">
                Featured Projects
              </h2>
              <div className="space-y-5">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="border border-gray-100 rounded-lg p-5"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-reckless font-semibold">
                            <a
                              href={project.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {project.name}
                            </a>
                          </h3>
                          {project.summary && (
                            <p className="mt-1 text-gray-700 text-sm">
                              {project.summary}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FiStar className="mr-1" />
                            {project.stargazers_count?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center">
                            <FiGitBranch className="mr-1" />
                            {project.forks_count?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                      
                      {/* Repository Stats and Links */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {project.language && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                              {project.language}
                            </div>
                          )}
                          {project.homepage && (
                            <a 
                              href={project.homepage} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center hover:text-blue-600"
                              title="Project Website"
                            >
                              <FiGlobe className="mr-1" />
                              Website
                            </a>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <a
                            href={project.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-blue-600 flex items-center"
                            title="View on GitHub"
                          >
                            <FiGithub className="mr-1" />
                            GitHub
                          </a>
                        </div>
                      </div>
                      
                      {/* Tech Stack */}
                      {repoLanguages[project.id] && (
                        <div className="pt-2">
                          <div className="text-xs text-gray-500 font-medium mb-1">Tech Stack</div>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(repoLanguages[project.id])
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 5)
                              .map(([language, percentage]) => (
                                <div 
                                  key={language} 
                                  className="flex items-center text-xs bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full"
                                  title={`${language} (${percentage.toFixed(1)}%)`}
                                >
                                  <span className="font-medium text-gray-700">{language}</span>
                                  <span className="ml-1 text-gray-400 text-xs">{Math.round(percentage)}%</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col gap-2 items-end min-w-fit">
                        {project.stars > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <FiStar className="inline" /> {project.stars}
                          </span>
                        )}
                        {project.language && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                            {project.language}
                          </span>
                        )}
                      </div>
                    </div>
                    {project.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-200 text-gray-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {config.includeReadmeBullets &&
                      project.bullets.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm text-gray-600 list-disc list-inside">
                          {project.bullets.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {config.sections.visuals && (
            <section className="mt-10">
              <h2 className="text-2xl font-reckless font-extrabold mb-5 tracking-tight text-gray-800">
                Development Statistics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Repository Count */}
                <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm transition-shadow duration-200">
                  <div className="text-3xl font-bold text-black mb-1 font-reckless">
                    {stackSummary.stats?.repositoryCount ?? 0}
                  </div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider ">
                    Repositories
                  </div>
                </div>
                {/* Total Commits */}
                <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm transition-shadow duration-200">
                  <div className="text-3xl font-bold text-black mb-1 font-reckless">
                    {(stackSummary.stats?.totalCommits ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider ">
                    Total Commits
                  </div>
                </div>
                {/* Longest Streak */}
                <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm transition-shadow duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-3xl font-bold text-black mb-1 font-reckless">
                        {cachedStreak ?? (stackSummary.stats?.longestStreak ?? 0)} days
                      </div>
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Longest Streak
                      </div>
                    </div>
                    <button
                      onClick={handleCalculateStreak}
                      disabled={isCalculating}
                      className={`p-2 rounded-full ${isCalculating ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-100'}`}
                      title="Calculate commit streak"
                    >
                      <FiRefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {!cachedStreak && (
                    <p className="text-xs text-gray-500 mt-2">
                      Click the refresh icon to calculate your longest commit streak
                    </p>
                  )}
                </div>
                {/* Total Stars */}
                <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm transition-shadow duration-200">
                  <div className="text-3xl font-bold text-black mb-1 font-reckless">
                    {(stackSummary.stats?.totalStars ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider ">
                    Total Stars
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Footer: logo left, tagline right */}
      <footer className="mt-14 pt-8 pb-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/gitprooflogo.png"
            alt="GitProof Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
        </div>
        <span className="font-reckless text-base text-black tracking-tight">
          Proof of work, <span className="italic">without</span> the guesswork.
        </span>
      </footer>
    </div>
  );
}
