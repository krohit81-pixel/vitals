import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, CoachFeedback, CoachPromptContext, MealAnalysis } from "../types";
import { buildCoachPrompt, buildImageAnalysisPrompt, buildTextAnalysisPrompt } from "../prompts";
import { extractJson, toMealAnalysis } from "../json";

const MODEL = "gemini-2.0-flash"; // fast + multimodal; swap via env if needed later

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
}

export class GeminiProvider implements AIProvider {
  async analyzeMealImage(imageBase64: string, mimeType: string): Promise<MealAnalysis> {
    const model = getClient().getGenerativeModel({ model: MODEL });

    const result = await model.generateContent([
      buildImageAnalysisPrompt(),
      { inlineData: { data: imageBase64, mimeType } },
    ]);

    const parsed = extractJson(result.response.text()) as Parameters<typeof toMealAnalysis>[0];
    return toMealAnalysis(parsed);
  }

  async analyzeMealText(description: string): Promise<MealAnalysis> {
    const model = getClient().getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(buildTextAnalysisPrompt(description));
    const parsed = extractJson(result.response.text()) as Parameters<typeof toMealAnalysis>[0];
    return toMealAnalysis(parsed);
  }

  async generateCoachFeedback(context: CoachPromptContext): Promise<CoachFeedback> {
    const model = getClient().getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(buildCoachPrompt(context));
    const parsed = extractJson(result.response.text()) as CoachFeedback;
    return parsed;
  }
}
