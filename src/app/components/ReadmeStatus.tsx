'use client';

import { useState } from 'react';
import { FiAlertTriangle, FiCopy, FiCheck, FiRefreshCw } from 'react-icons/fi';

interface ReadmeStatusProps {
  readmeContent: string;
  repoName: string;
  description: string;
  languages: Record<string, number>;
  repoUrl: string;
}

export default function ReadmeStatus({ readmeContent, repoName, description, languages, repoUrl }: ReadmeStatusProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReadme, setGeneratedReadme] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');
  
  const wordCount = readmeContent ? readmeContent.split(/\s+/).length : 0;
  const isReadmeInsufficient = wordCount < 100; // Consider READMEs with less than 100 words as insufficient

  const generateReadme = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-readme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoName,
          description,
          languages,
          repoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate README');
      }

      const data = await response.json();
      setGeneratedReadme(data.readme);
    } catch (error) {
      console.error('Error generating README:', error);
      alert('Failed to generate README. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedReadme) return;
    
    setCopyStatus('copying');
    try {
      await navigator.clipboard.writeText(generatedReadme);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyStatus('idle');
    }
  };

  if (!isReadmeInsufficient) return null;

  return (
    <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-amber-800">
              README Needs Attention
            </h3>
            {generatedReadme && (
              <button
                onClick={copyToClipboard}
                disabled={copyStatus !== 'idle'}
                className="text-xs text-amber-700 hover:text-amber-600 font-medium flex items-center gap-1"
              >
                {copyStatus === 'copied' ? (
                  <>
                    <FiCheck className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : copyStatus === 'copying' ? (
                  <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <FiCopy className="h-3.5 w-3.5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              This README is quite short ({wordCount} words). A good README typically has at least 100 words.
            </p>
            {!generatedReadme ? (
              <button
                onClick={generateReadme}
                disabled={isGenerating}
                className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-600 underline flex items-center gap-1"
              >
                {isGenerating ? (
                  <>
                    <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  'Generate AI README?'
                )}
              </button>
            ) : (
              <div className="mt-3 bg-white p-3 rounded-md border border-amber-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-900">Generated README</h4>
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-60">
                  {generatedReadme}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
