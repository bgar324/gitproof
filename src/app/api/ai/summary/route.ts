// /app/api/ai/summary/route.ts
import { getAiSummary } from "@/lib/gemini"; // Make sure this path is correct
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("API_ROUTE: Received POST request to /api/ai/summary");
  try {
    const { repoName, description, languages, readme } = await req.json();
    console.log("API_ROUTE: Parsed request body successfully.");

    const promptParts = [
      'Generate a concise, recruiter-friendly summary (2-3 sentences) for a GitHub project based on the following information:',
      '',
      `Project Name: ${repoName}`,
      `Description: ${description || 'N/A'}`,
      `Languages Used: ${Object.keys(languages || {}).join(', ') || 'N/A'}`,
      readme ? `README Content (first 1000 chars): ${String(readme).slice(0, 1000)}` : 'README Content: N/A'
    ];
    const prompt = promptParts.join('\n');
    // Avoid logging the full prompt if it's too long or contains sensitive info in production
    console.log("API_ROUTE: Constructed prompt for Gemini (first 200 chars):", prompt.substring(0, 200) + "...");

    const summary = await getAiSummary(prompt, `summary-${repoName}`)
    console.log("API_ROUTE: Received summary from getAiSummary (first 200 chars):", summary.substring(0, 200) + "...");

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error("API_ROUTE: Critical error in POST /api/ai/summary:", error);
    // Ensure a JSON response is sent even for errors
    return NextResponse.json(
      { error: "Failed to generate AI summary due to an internal server error.", details: error.message || String(error) },
      { status: 500 }
    );
  }
}