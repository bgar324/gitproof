import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReadmePreviewProps {
  owner: string;
  repo: string;
  accessToken?: string;
  className?: string;
}

export default function ReadmePreview({
  owner,
  repo,
  accessToken,
  className = "",
}: ReadmePreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setContent(null);

    const fetchReadme = async () => {
      setLoading(true);
      setError(null);
      setContent(null);

      try {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
        const headers: HeadersInit = {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        };

        // 1. Try JSON (should contain .content, base64)
        const jsonRes = await fetch(apiUrl, {
          headers: { ...headers, Accept: "application/vnd.github.v3+json" },
        });
        if (jsonRes.ok) {
          const ct = jsonRes.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const data = await jsonRes.json();
            if (data.content && data.encoding === "base64") {
              const markdown = atob(data.content.replace(/\n/g, ""));
              setContent(markdown);
              setLoading(false);
              return;
            }
          }
        }

        // 2. Fallback: get as raw Markdown
        const rawRes = await fetch(apiUrl, {
          headers: { ...headers, Accept: "application/vnd.github.v3.raw" },
        });
        if (rawRes.ok) {
          const md = await rawRes.text();
          setContent(md);
          setLoading(false);
          return;
        }

        // 3. Fallback: raw.githubusercontent.com, only for public repos (no auth header)
        const branch = "main";
        const fileNames = [
          "README.md",
          "readme.md",
          "README.MD",
          "Readme.md",
          "README",
        ];
        for (const fname of fileNames) {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fname}`;
          const fallbackRes = await fetch(rawUrl);
          if (fallbackRes.ok) {
            const md = await fallbackRes.text();
            setContent(md);
            setLoading(false);
            return;
          }
        }

        throw new Error("README not found in this repository.");
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchReadme();
    return () => {
      isMounted = false;
    };
  }, [owner, repo, accessToken]);

  if (loading)
    return (
      <div className={`${className} p-4 bg-gray-50 rounded-md`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  if (error)
    return (
      <div className={`${className} p-4 bg-red-50 text-red-600 rounded-md`}>
        <p>Failed to load README</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  if (!content)
    return (
      <div className={`${className} p-4 bg-gray-50 rounded-md`}>
        <p className="text-gray-400">No README found.</p>
      </div>
    );

    return (
      <div className={`${className} bg-white rounded-md border border-gray-200 overflow-hidden`}>
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-medium text-sm text-gray-700">README.md</h3>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-2 px-2 py-1 text-xs rounded hover:bg-gray-200 transition"
          >
            {collapsed ? "Show" : "Hide"}
          </button>
        </div>
        {!collapsed && (
          <div className="p-4 prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }: any) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
                ),
                code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline ? (
                    <div className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto my-2">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </div>
                  ) : (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  );
                },
                h1: ({ node, ...props }: any) => (
                  <h2 className="text-sm font-bold mt-4 mb-2 font-mono" {...props} />
                ),
                h2: ({ node, ...props }: any) => (
                  <h3 className="text-xs font-semibold mt-4 mb-2 font-mono" {...props} />
                ),
                h3: ({ node, ...props }: any) => (
                  <h4 className="text-xs font-medium mt-3 mb-1.5 font-mono" {...props} />
                ),
                p: ({ node, ...props }: any) => (
                  <p className="my-2 text-xs leading-relaxed font-mono" {...props} />
                ),
                ul: ({ node, ...props }: any) => (
                  <ul className="text-xs list-disc pl-5 my-2 space-y-1 font-mono" {...props} />
                ),
                ol: ({ node, ...props }: any) => (
                  <ol className="text-xs list-decimal pl-5 my-2 space-y-1 font-mono" {...props} />
                ),
                blockquote: ({ node, ...props }: any) => (
                  <blockquote
                    className="text-xs border-l-4 border-gray-300 pl-4 italic text-gray-600 my-3 font-mono"
                    {...props}
                  />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
}
