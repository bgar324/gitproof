'use client';

import { useState } from 'react';
import { FiAlertTriangle, FiCopy, FiCheck, FiRefreshCw, FiX } from 'react-icons/fi';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const charCount = readmeContent ? readmeContent.length : 0;
  const isReadmeInsufficient = charCount < 100; // Consider READMEs with less than 100 characters as insufficient

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
      setIsPreviewOpen(true);
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
    <>
      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <FiAlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  README Needs Improvement
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  This README is only {charCount} characters long. A good README should be at least 100 characters.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateReadme}
                  disabled={isGenerating}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <FiRefreshCw className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5" />
                      Generating...
                    </>
                  ) : (
                    'Generate README'
                  )}
                </button>
                {generatedReadme && (
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    View Generated
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* README Preview Modal */}
      {isPreviewOpen && generatedReadme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Generated README for {repoName}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  disabled={copyStatus !== 'idle'}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copyStatus === 'copied' ? (
                    <>
                      <FiCheck className="h-3.5 w-3.5 mr-1.5" />
                      Copied!
                    </>
                  ) : copyStatus === 'copying' ? (
                    <>
                      <FiRefreshCw className="animate-spin h-3.5 w-3.5 mr-1.5" />
                      Copying...
                    </>
                  ) : (
                    <>
                      <FiCopy className="h-3.5 w-3.5 mr-1.5" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  {generatedReadme}
                </pre>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 rounded-b-lg flex justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
