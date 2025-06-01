// /lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure your GEMINI_API_KEY is correctly set in your .env or environment variables
if (!process.env.GEMINI_API_KEY) {
  // This error will be caught by the serverless function handler if thrown at module load,
  // or by the API route's try-catch if this module is imported and then fails.
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiSummaryCache: Record<string, string> = {}

export async function getAiSummary(prompt: string, cacheKey: string): Promise<string> {
  if (aiSummaryCache[cacheKey]) {
    console.log("GEMINI_LIB: Cache hit for key:", cacheKey)
    return aiSummaryCache[cacheKey]
  }

  console.log("GEMINI_LIB: Cache miss, generating summary (prompt snippet):", prompt.substring(0, 100) + "...")

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });    

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    aiSummaryCache[cacheKey] = text
    console.log("GEMINI_LIB: Generated and cached summary (snippet):", text.substring(0, 100) + "...")
    return text;
  } catch (error: any) {
    console.error("GEMINI_LIB: Error during Gemini API call:", error);
    throw new Error(`Gemini API request failed: ${error.message || String(error)}`);
  }
}
