import { NextResponse } from "next/server";
import { getAiSummary } from "@/lib/gemini";

export interface GenerateReadmeRequest {
  repoName: string;
  description: string;
  languages: Record<string, number>;
  repoUrl: string;
  installation?: string;
  usage?: string;
  features?: string[];
  contributing?: string;
  license?: string;
}

export async function POST(request: Request) {
  try {
    const body: GenerateReadmeRequest = await request.json();
    
    const prompt = `Create a professional README.md for the repository "${body.repoName}" with the following details:

# Repository Information
- Description: ${body.description || 'No description provided'}
- Repository URL: ${body.repoUrl}
- Main Technologies: ${Object.entries(body.languages || {})
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([lang]) => lang)
  .join(', ')}

# Instructions
1. Create a clear, well-structured README with the following sections:
   - Project Title and Badges
   - Description (expand on the provided one if needed)
   - Features (if any provided)
   - Installation (if provided, otherwise suggest common steps)
   - Usage (if provided, otherwise provide examples)
   - Technologies Used
   - Contributing (if provided, otherwise use standard guidelines)
   - License (if provided, otherwise suggest MIT)

2. Make it engaging and professional
3. Use proper markdown formatting
4. Include relevant emojis for better readability
5. Keep technical details clear and concise
6. Add a table of contents if the README is long

# Additional Context
${body.installation ? `## Installation\n${body.installation}\n` : ''}
${body.usage ? `## Usage\n${body.usage}\n` : ''}
${body.features?.length ? `## Features\n${body.features.map(f => `- ${f}`).join('\n')}\n` : ''}
${body.contributing ? `## Contributing\n${body.contributing}\n` : ''}
${body.license ? `## License\n${body.license}\n` : ''}`;

    console.log('Generating README with prompt:', prompt);
    const readmeContent = await getAiSummary(prompt);
    
    return NextResponse.json({ 
      readme: readmeContent,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error generating README:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate README' },
      { status: 500 }
    );
  }
}
