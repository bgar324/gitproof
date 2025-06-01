import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

const MAX_LINES = 5; // Maximum number of lines to show before truncating
const LINE_HEIGHT = 24; // Approximate line height in pixels

interface ShowcaseData {
  showcaseRepos: string[]
  explanations: Record<string, string>
  improvements: string[]
}

interface ReadmeSuggestion {
  structure: string[]
  recommendations: string[]
}

type AiInsightsProps = {
  repos: any[]
  languages?: Record<string, number>
  commitActivity?: Record<string, number>
  createdAt?: string
}

type Insights = {
  developer: string | null
  recruiter: string | null
}

interface InsightResponse {
  analysis: string;
}

export default function AiInsights({ repos, languages, commitActivity, createdAt }: AiInsightsProps) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<Insights>({ developer: null, recruiter: null })
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    // Try to load cached insights
    const cached = localStorage.getItem('aiInsights')
    if (cached) {
      setInsights(JSON.parse(cached))
    }
  }, [])

  const generateInsights = async () => {
    setLoading(true)
    setError(null)

    try {
      const requestData = {
        repos,
        languages,
        commitActivity,
        createdAt: createdAt || new Date().toISOString()
      };

      const [devResponse, recruiterResponse] = await Promise.all([
        fetch('/api/ai/developer-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        }),
        fetch('/api/ai/recruiter-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        })
      ])

      const [devData, recruiterData] = await Promise.all([
        devResponse.json(),
        recruiterResponse.json()
      ])

      if (!devResponse.ok) throw new Error(devData.error || 'Failed to fetch developer insights')
      if (!recruiterResponse.ok) throw new Error(recruiterData.error || 'Failed to fetch recruiter insights')

      const newInsights = {
        developer: devData.analysis,
        recruiter: recruiterData.analysis
      }

      setInsights(newInsights)
      localStorage.setItem('aiInsights', JSON.stringify(newInsights))
    } catch (err) {
      console.error('Error generating insights:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setLoading(false)
    }
  };

  const checkOverflow = (id: string) => {
    const element = contentRefs.current[id];
    if (!element) return false;
    return element.scrollHeight > MAX_LINES * LINE_HEIGHT;
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderInsight = (id: 'developer' | 'recruiter', title: string, content: string | null) => {
    if (!content) return null;
    const isExpanded = expanded[id] || false;
    const hasOverflow = checkOverflow(id);
    const shouldShowButton = hasOverflow || isExpanded;

    return (
      <div key={id} className="mb-6">
        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 underline">
          {title} 
        </h4>
        <div 
          ref={el => {
            if (el) {
              contentRefs.current[id] = el;
            }
          }}
          className={`prose prose-sm max-w-none overflow-hidden transition-all duration-200 ${expanded[id] ? 'max-h-none' : 'max-h-[120px]'}`}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {shouldShowButton && (
          <button
            onClick={() => toggleExpand(id)}
            className="text-sm text-blue-500 hover:text-blue-700 mt-2 focus:outline-none"
          >
            {expanded[id] ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-semibold font-reckless">AI Insights ✨</h2>
        {!insights.developer && !insights.recruiter && (
          <button
            onClick={generateInsights}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Insights'
            )}
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Developer Insights Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {renderInsight('developer', 'Developer Insights', insights.developer)}
        </div>
        
        {/* Recruiter Summary Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {renderInsight('recruiter', 'Recruiter Summary', insights.recruiter)}
        </div>
      </div>
    </div>
  );
}
