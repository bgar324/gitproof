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
    
    const prompt = `
    You are a professional developer and technical writer. Create a clear, well-structured, recruiter-ready README.md for the GitHub repository "${body.repoName}". Use all the provided information. Strictly output only markdown that can be copy-pasted as README.md—no code block fences or extraneous commentary.
    
    # Repository Details
    - Name: ${body.repoName}
    - Description: ${body.description || 'No description provided.'}
    - Repository URL: ${body.repoUrl}
    - Main Technologies: ${Object.entries(body.languages || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang)
      .join(', ')}
    
    # Required Sections (use all if possible):
    1. **Project Title** (large, first line) and badges for stars, forks, license, top language.
    2. **Description** — Expand and improve the provided description. Make it engaging, clear, and inviting.
    3. **Features** — If features are provided, include and expand. Otherwise, invent plausible features for this type of project.
    4. **Installation** — If installation instructions are provided, include them. Otherwise, add standard installation steps for a typical modern project of this stack.
    5. **Usage** — If usage is provided, include it. Otherwise, invent example usage or commands.
    6. **Technologies Used** — Explicitly list the top languages and any frameworks/tools implied by the codebase.
    7. **Contributing** — If instructions are provided, use them. Otherwise, add a clear “How to Contribute” section with standard open source etiquette.
    8. **License** — Use provided license, or default to MIT.
    9. **Table of Contents** — If the README is long enough to warrant it.
    10. Add relevant emojis to section headings for visual appeal, but keep them professional.
    
    # Formatting Rules
    - Only output plain markdown—**do NOT wrap output in code fences**.
    - Use GitHub Flavored Markdown (GFM): tables, lists, links, badges, emoji.
    - Make sure all links are valid and formatted as markdown.
    - Keep language clear and professional, suitable for both recruiters and developers.
    
    # Additional Provided Content
    ${body.installation ? `## Installation\n${body.installation}\n` : ''}
    ${body.usage ? `## Usage\n${body.usage}\n` : ''}
    ${body.features?.length ? `## Features\n${body.features.map(f => `- ${f}`).join('\n')}\n` : ''}
    ${body.contributing ? `## Contributing\n${body.contributing}\n` : ''}
    ${body.license ? `## License\n${body.license}\n` : ''}
    `;    

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
