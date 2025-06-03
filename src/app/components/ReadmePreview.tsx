import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw"

interface ReadmePreviewProps {
  content: string;
  className?: string;
}

export default function ReadmePreview({
  content,
  className = "",
}: ReadmePreviewProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      setIsOverflowing(scrollHeight > clientHeight);
    }
  }, [content]);

  if (!content) return null;

  // Sanitize content to prevent XSS and ensure it's a string
  const sanitizedContent = typeof content === 'string' ? content : String(content || '');

  return (
    <div className={`prose max-w-none ${className}`}>
      <div 
        ref={contentRef}
        className={`prose max-w-none prose-sm ${collapsed ? 'max-h-48 overflow-hidden' : ''}`}
      >
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]} // <-- Enable HTML rendering
          components={{
            img: ({ ...props }) => (
              <img 
                {...props} 
                className="rounded-md border border-gray-200 my-2 max-w-full h-auto" 
                alt={props.alt || 'Image'}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3ODc4N2YiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiPjwvY2lyY2xlPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDE2IDkgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4=';
                }}
              />
            ),
            a: ({ ...props }) => (
              <a 
                {...props} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              />
            ),
          }}
        >
          {sanitizedContent}
        </ReactMarkdown>
      </div>
      {isOverflowing && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sm text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1"
        >
          {collapsed ? 'Read more' : 'Show less'}
          <svg
            className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
