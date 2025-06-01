import { NextResponse } from 'next/server'
import { getAiSummary } from '@/lib/gemini'
import { aggregateLanguagesByYear } from '@/lib/github-metrics'

export async function POST(request: Request) {
  try {
    const { repos, createdAt } = await request.json()
    
    // Calculate years on GitHub
    const joinDate = new Date(createdAt)
    const currentDate = new Date()
    const yearsOnGitHub = currentDate.getFullYear() - joinDate.getFullYear()

    // Get language evolution data
    const yearlyLanguages = aggregateLanguagesByYear(repos)

    // Construct a focused prompt for quick summary
    const prompt = `Generate a 2-3 sentence summary of this developer's GitHub profile focusing on their technical evolution and expertise level. Be concise and specific.

Profile Overview:
- Years on GitHub: ${yearsOnGitHub}
- Total Repositories: ${repos.length}
- Primary Languages: ${Object.entries(yearlyLanguages)
  .sort(([a], [b]) => Number(b) - Number(a))
  .map(([year, langs]) =>
    `${year}: ${Object.entries(langs)
      .sort(([,a], [,b]) => b - a)
      .map(([lang]) => lang)
      .slice(0, 3)
      .join(', ')}`
  ).join('\n')}

Focus on:
1. Experience level based on GitHub tenure and activity
2. Technical evolution (e.g. "Started with Python, transitioned to React")
3. Current primary tech stack

Keep the response under 50 words, focusing on technical progression and current expertise.`

    const summary = await getAiSummary(prompt, 'quick-summary')
    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Error in quick summary:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
