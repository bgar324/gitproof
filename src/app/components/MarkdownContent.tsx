import { marked } from 'marked'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const html = marked.parse(content)
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: html as string }} 
    />
  )
}
