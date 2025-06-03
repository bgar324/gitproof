import { useRef } from "react";
import type {
  ExportConfig,
  ProjectExport,
  StackSummary,
} from "../../types/export";
import { FiGithub, FiStar, FiGitBranch, FiCalendar } from "react-icons/fi";
import Image from "next/image";

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

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
                  <div>2018 – Present</div>
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
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-reckless font-semibold">
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-black"
                          >
                            {project.name}
                          </a>
                        </h3>
                        {project.summary && (
                          <p className="mt-1 text-gray-700">
                            {project.summary}
                          </p>
                        )}
                      </div>
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
            <section>
              <h2 className="text-2xl font-reckless font-extrabold mb-5 tracking-tight">
                Development Activity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config.includeCommitHeatmap && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-reckless mb-3 text-gray-700">
                      Contribution Heatmap
                    </h3>
                    <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                      [Commit Heatmap Placeholder]
                    </div>
                  </div>
                )}
                {config.includePieChart && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-reckless mb-3 text-gray-700">
                      Language Distribution
                    </h3>
                    <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                      [Pie Chart Placeholder]
                    </div>
                  </div>
                )}
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
