import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  return (
    <div className={`prose max-w-none ${className}`}>
      <div 
        ref={contentRef}
        className={`prose max-w-none prose-sm ${collapsed ? 'max-h-48 overflow-hidden' : ''}`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
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
