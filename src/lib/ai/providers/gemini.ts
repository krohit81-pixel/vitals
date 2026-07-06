import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, CoachFeedback, CoachPromptContext, MealAnalysis } from "../types";
import { buildCoachPrompt, buildImageAnalysisPrompt, buildRefinementPrompt, buildTextAnalysisPrompt } from "../prompts";
import { extractJson, toMealAnalysis } from "../json";

const MODEL = "gemini-2.5-flash"; // gemini-2.0-flash was shut down by Google on June 1, 2026

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

  async refineMealAnalysis(
    previous: MealAnalysis,
    answers: Array<{ question: string; answer: "yes" | "no" }>
  ): Promise<MealAnalysis> {
    const model = getClient().getGenerativeModel({ model: MODEL });
    const prompt = buildRefinementPrompt(
      previous.explanation,
      previous.items.map((i) => ({ name: i.name, estimatedQuantity: i.estimatedQuantity })),
      answers
    );
    const result = await model.generateContent(prompt);
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
