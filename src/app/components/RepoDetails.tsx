// "use client"

// import { useState, useEffect } from 'react'
// import ReactMarkdown from 'react-markdown'
// import remarkGfm from 'remark-gfm'
// import { GitHubRepo } from '../types/github'

// type RepoDetailsProps = {
//   repo: GitHubRepo
//   accessToken: string
// }

// type LanguageStats = {
//   [key: string]: number
// }

// // Helper function to get color for a programming language
// function getLanguageColor(language: string): string {
//   const colors: Record<string, string> = {
//     'JavaScript': '#f1e05a',
//     'TypeScript': '#3178c6',
//     'Python': '#3572A5',
//     'Java': '#b07219',
//     'C++': '#f34b7d',
//     'C#': '#178600',
//     'PHP': '#4F5D95',
//     'Ruby': '#701516',
//     'Go': '#00ADD8',
//     'Rust': '#dea584',
//     'Swift': '#F05138',
//     'Kotlin': '#A97BFF',
//     'HTML': '#e34c26',
//     'CSS': '#563d7c',
//     'SCSS': '#c6538c',
//     'Shell': '#89e051',
//     'Dockerfile': '#384d54',
//     'Makefile': '#427819',
//     'Vue': '#41b883',
//     'React': '#61dafb',
//     'Angular': '#dd0031',
//     'Svelte': '#ff3e00',
//   };

//   return colors[language] || '#cccccc';
// }

// export default function RepoDetails({ repo, accessToken }: RepoDetailsProps) {
//   const [expanded, setExpanded] = useState(false)
//   const [readme, setReadme] = useState<string>('')
//   const [languages, setLanguages] = useState<LanguageStats>({})
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   // Simplified README fetch using GitHub's raw content URL
//   const fetchReadme = async () => {
//     if (loading) return;
//     setLoading(true);
//     setError(null);
//     setReadme('Loading README...');

//     try {
//       // First try to get the default branch
//       const repoInfoRes = await fetch(
//         `https://api.github.com/repos/${repo.full_name}`,
//         {
//           headers: {
//             'Accept': 'application/vnd.github.v3+json',
//             ...(accessToken ? { 'Authorization': `token ${accessToken}` } : {})
//           }
//         }
//       );

//       if (!repoInfoRes.ok) {
//         throw new Error(`GitHub API error: ${repoInfoRes.status} ${repoInfoRes.statusText}`);
//       }

//       const repoInfo = await repoInfoRes.json();
//       const defaultBranch = repoInfo.default_branch || 'main';
      
//       // Try to fetch README directly from raw.githubusercontent.com
//       const readmeUrl = `https://raw.githubusercontent.com/${repo.full_name}/${defaultBranch}/README.md`;
//       const readmeRes = await fetch(readmeUrl, {
//         cache: 'no-store' // Prevent caching issues
//       });

//       if (readmeRes.ok) {
//         const content = await readmeRes.text();
//         setReadme(content || 'No README content available.');
//       } else {
//         // If direct fetch fails, try common README filenames
//         const readmeFiles = ['README.md', 'readme.md', 'README.MD', 'Readme.md'];
        
//         for (const filename of readmeFiles) {
//           const altReadmeUrl = `https://raw.githubusercontent.com/${repo.full_name}/${defaultBranch}/${filename}`;
//           const altRes = await fetch(altReadmeUrl, { cache: 'no-store' });
          
//           if (altRes.ok) {
//             const content = await altRes.text();
//             setReadme(content);
//             return;
//           }
//         }
        
//         throw new Error('No README file found in repository');
//       }
//     } catch (err: any) {
//       console.error('Error fetching README:', err);
//       setError(`Failed to load README: ${err.message}`);
//       setReadme('');
//     } finally {
//       setLoading(false);
//     }
//   }

//   // Fetch repo language stats
//   const fetchLanguages = async () => {
//     try {
//       const res = await fetch(repo.languages_url, {
//         headers: accessToken ? { 'Authorization': `token ${accessToken}` } : {}
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setLanguages(data);
//       }
//     } catch (err) {
//       // silent error
//     }
//   };

//   useEffect(() => {
//     fetchReadme();
//     fetchLanguages();
//     // eslint-disable-next-line
//   }, [repo.full_name, accessToken])

//   const cleanMarkdown = (content: string): string => {
//     if (!content) return 'No README content available.';
//     try {
//       return content
//         .replace(/[\u0000-\u001F]/g, '') // Control characters
//         .replace(/[^\x20-\x7E\n\r]/g, '') // Non-printable
//         .replace(/^---[\s\S]*?---\s*/, '') // Remove YAML front matter
//         .replace(/[\r\n]+/g, '\n') // Normalize line endings
//         .trim();
//     } catch {
//       return content;
//     }
//   };

//   const markdownComponents = {
//     code({ node, className, children, ...props }: any) {
//       const isInline = !className?.includes('language-');
//       if (isInline) {
//         return (
//           <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
//             {children}
//           </code>
//         );
//       }
//       return (
//         <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
//           <code className={className} {...props}>
//             {children}
//           </code>
//         </pre>
//       );
//     },
//     a({ node, href, children, ...props }: any) {
//       return (
//         <a
//           href={href}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-blue-600 hover:underline"
//           {...props}
//         >
//           {children}
//         </a>
//       );
//     },
//   };

//   const totalBytes = Object.values(languages).reduce<number>(
//     (sum, bytes) => sum + (typeof bytes === 'number' ? bytes : 0),
//     0
//   );

//   return (
//     <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
//       <div className="flex items-start justify-between mb-4">
//         <div>
//           <a
//             href={repo.html_url}
//             target="_blank"
//             rel="noreferrer"
//             className="text-xl font-bold hover:text-blue-600 dark:hover:text-blue-400"
//           >
//             {repo.name}
//           </a>
//           <p className="text-gray-600 dark:text-gray-400 mt-1">{repo.description}</p>
//           <a
//             href={repo.html_url}
//             target="_blank"
//             rel="noreferrer"
//             className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
//           >
//             View on GitHub
//           </a>
//         </div>
//         <button
//           onClick={() => setExpanded(!expanded)}
//           className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
//         >
//           {expanded ? 'Show Less' : 'Show More'}
//         </button>
//       </div>

//       {loading ? (
//         <div className="flex justify-center py-4">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//         </div>
//       ) : error ? (
//         <div className="text-red-500 dark:text-red-400">{error}</div>
//       ) : (
//         <div className={`prose dark:prose-invert max-w-none ${!expanded ? 'line-clamp-6' : ''}`}>
//           <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
//             {cleanMarkdown(readme)}
//           </ReactMarkdown>
//         </div>
//       )}

//       {Object.keys(languages).length > 0 && (
//         <div className="mt-6">
//           <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Languages</h3>
//           <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
//             {Object.entries(languages).map(([lang, bytes]) => {
//               const percentage = Math.round((Number(bytes) / totalBytes) * 100);
//               return (
//                 <div
//                   key={lang}
//                   className="h-full inline-block"
//                   style={{
//                     width: `${percentage}%`,
//                     backgroundColor: getLanguageColor(lang),
//                   }}
//                   title={`${lang} ${percentage}%`}
//                 />
//               );
//             })}
//           </div>
//           <div className="flex flex-wrap gap-2 mt-2">
//             {Object.entries(languages)
//               .sort((a, b) => Number(b[1]) - Number(a[1]))
//               .map(([lang, bytes]) => {
//                 const percentage = Math.round((Number(bytes) / totalBytes) * 100);
//                 return (
//                   <span
//                     key={lang}
//                     className="inline-flex items-center text-xs text-gray-700 dark:text-gray-300"
//                   >
//                     <span
//                       className="w-3 h-3 rounded-full mr-1"
//                       style={{ backgroundColor: getLanguageColor(lang) }}
//                     />
//                     {lang} {percentage}%
//                   </span>
//                 );
//               })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
