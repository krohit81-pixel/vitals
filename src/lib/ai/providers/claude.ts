import type { AIProvider, CoachFeedback, CoachPromptContext, MealAnalysis, HealthInsights, HealthInsightsContext } from "../types";
import { buildCoachPrompt, buildImageAnalysisPrompt, buildRefinementPrompt, buildTextAnalysisPrompt, buildHealthInsightsPrompt } from "../prompts";
import { extractJson, toMealAnalysis } from "../json";

const MODEL = "claude-sonnet-4-6";

async function messages(content: unknown): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic request failed: ${res.status}`);
  const data = await res.json();
  return data.content.find((b: { type: string }) => b.type === "text")?.text ?? "";
}

export class ClaudeProvider implements AIProvider {
  async analyzeMealImage(imageBase64: string, mimeType: string): Promise<MealAnalysis> {
    const text = await messages([
      { type: "text", text: buildImageAnalysisPrompt() },
      { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
    ]);
    return toMealAnalysis(extractJson(text) as Parameters<typeof toMealAnalysis>[0]);
  }

  async analyzeMealText(description: string): Promise<MealAnalysis> {
    const text = await messages(buildTextAnalysisPrompt(description));
    return toMealAnalysis(extractJson(text) as Parameters<typeof toMealAnalysis>[0]);
  }

  async refineMealAnalysis(
    previous: MealAnalysis,
    answers: Array<{ question: string; answer: "yes" | "no" }>
  ): Promise<MealAnalysis> {
    const prompt = buildRefinementPrompt(
      previous.explanation,
      previous.items.map((i) => ({ name: i.name, estimatedQuantity: i.estimatedQuantity })),
      answers
    );
    const text = await messages(prompt);
    return toMealAnalysis(extractJson(text) as Parameters<typeof toMealAnalysis>[0]);
  }

  async generateCoachFeedback(context: CoachPromptContext): Promise<CoachFeedback> {
    const text = await messages(buildCoachPrompt(context));
    return extractJson(text) as CoachFeedback;
  }

  async generateHealthInsights(context: HealthInsightsContext): Promise<HealthInsights> {
    const text = await messages(buildHealthInsightsPrompt(context));
    return extractJson(text) as HealthInsights;
  }
}
