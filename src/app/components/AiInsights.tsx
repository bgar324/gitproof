import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiChevronDown, FiChevronUp, FiZap } from "react-icons/fi";

const MAX_LINES = 5; // Maximum number of lines to show before truncating
const LINE_HEIGHT = 24; // Approximate line height in pixels

// Custom components for markdown rendering
const components = {
  h1: ({ node, ...props }: any) => (
    <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-900" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h3 className="text-lg font-medium mt-5 mb-2 text-gray-800" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-gray-700 mb-3 leading-relaxed" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="text-gray-700" {...props} />
  ),
  a: ({ node, ...props }: any) => (
    <a
      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: ({ node, ...props }: any) => (
    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
  ),
  pre: ({ node, ...props }: any) => (
    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto my-4" {...props} />
  ),
};

type AiInsightsProps = {
  repos: any[];
  languages?: Record<string, number>;
  commitActivity?: Record<string, number>;
  createdAt?: string;
};

type Insights = {
  developer: string | null;
  recruiter: string | null;
};

export default function AiInsights({
  repos,
  languages,
  commitActivity,
  createdAt,
}: AiInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insights>({
    developer: null,
    recruiter: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [overflow, setOverflow] = useState<Record<string, boolean>>({});
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasCachedInsights = !!insights.developer || !!insights.recruiter;

  useEffect(() => {
    const cached = localStorage.getItem("aiInsights");
    if (cached) {
      setInsights(JSON.parse(cached));
    }
  }, []);

  useEffect(() => {
    // Check overflow after insights are set and DOM is painted
    setTimeout(() => {
      const newOverflow: Record<string, boolean> = {};
      Object.keys(insights).forEach((id) => {
        const el = contentRefs.current[id];
        if (el) {
          newOverflow[id] = el.scrollHeight > MAX_LINES * LINE_HEIGHT;
        }
      });
      setOverflow(newOverflow);
    }, 0);
  }, [insights]);

  const clearCache = () => {
    localStorage.removeItem("aiInsights");
    setInsights({ developer: null, recruiter: null });
  };

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        repos,
        languages,
        commitActivity,
        createdAt: createdAt || new Date().toISOString(),
      };

      const [devResponse, recruiterResponse] = await Promise.all([
        fetch("/api/ai/developer-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }),
        fetch("/api/ai/recruiter-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }),
      ]);

      const [devData, recruiterData] = await Promise.all([
        devResponse.json(),
        recruiterResponse.json(),
      ]);

      if (!devResponse.ok)
        throw new Error(devData.error || "Failed to fetch developer insights");
      if (!recruiterResponse.ok)
        throw new Error(
          recruiterData.error || "Failed to fetch recruiter insights"
        );

      const newInsights = {
        developer: devData.analysis,
        recruiter: recruiterData.analysis,
      };

      setInsights(newInsights);
      localStorage.setItem("aiInsights", JSON.stringify(newInsights));
    } catch (err) {
      console.error("Error generating insights:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate insights"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderInsight = (
    id: "developer" | "recruiter",
    title: string,
    content: string | null
  ) => {
    if (!content) return null;
    const isExpanded = expanded[id] || false;
    const hasOverflow = overflow[id];
    const shouldShowButton = hasOverflow || isExpanded;

    return (
      <div key={id} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <h4 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
          {title === "For Developers" ? "👨‍💻 Developer Insights" : "👔 Recruiter Summary"}
        </h4>
        <div className="relative">
          <div
            ref={(el) => {
              if (el) {
                contentRefs.current[id] = el;
              }
            }}
            className={`prose prose-sm max-w-none overflow-hidden transition-all duration-300 ${
              isExpanded ? 'max-h-none' : 'max-h-[120px]'
            }`}
          >
            <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
          {!isExpanded && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"
              style={{
                opacity: hasOverflow ? 1 : 0,
                transition: 'opacity 200ms ease-in-out'
              }}
            />
          )}
        </div>
        {shouldShowButton && (
          <button
            onClick={() => toggleExpand(id)}
            className="text-sm text-gray-500 hover:text-gray-700 mt-3 focus:outline-none flex items-center gap-1 font-medium transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <FiChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Read more</span>
                <FiChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 bg-gray-100 rounded-lg w-1/3 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 bg-gray-100 rounded-lg w-1/3 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-semibold text-gray-900 font-reckless">AI Insights</h2>
        </div>
        {hasCachedInsights ? (
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors duration-200 hover:shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Clear Cache</span>
          </button>
        ) : (
          <button
            onClick={generateInsights}
            disabled={loading}
            className="font-reckless px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors duration-200 hover:shadow-sm"
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
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderInsight("developer", "For Developers", insights.developer)}
        {renderInsight("recruiter", "For Recruiters", insights.recruiter)}
      </div>
    </div>
  );
}
