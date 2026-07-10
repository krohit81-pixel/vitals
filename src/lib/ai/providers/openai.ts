import type { AIProvider, CoachFeedback, CoachPromptContext, MealAnalysis, HealthInsights, HealthInsightsContext } from "../types";
import { buildCoachPrompt, buildImageAnalysisPrompt, buildRefinementPrompt, buildTextAnalysisPrompt, buildHealthInsightsPrompt } from "../prompts";
import { extractJson, toMealAnalysis } from "../json";

const MODEL = "gpt-4o-mini";

async function chat(messages: unknown[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

export class OpenAIProvider implements AIProvider {
  async analyzeMealImage(imageBase64: string, mimeType: string): Promise<MealAnalysis> {
    const text = await chat([
      {
        role: "user",
        content: [
          { type: "text", text: buildImageAnalysisPrompt() },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ]);
    return toMealAnalysis(extractJson(text) as Parameters<typeof toMealAnalysis>[0]);
  }

  async analyzeMealText(description: string): Promise<MealAnalysis> {
    const text = await chat([
      { role: "user", content: buildTextAnalysisPrompt(description) },
    ]);
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
    const text = await chat([{ role: "user", content: prompt }]);
    return toMealAnalysis(extractJson(text) as Parameters<typeof toMealAnalysis>[0]);
  }

  async generateCoachFeedback(context: CoachPromptContext): Promise<CoachFeedback> {
    const text = await chat([{ role: "user", content: buildCoachPrompt(context) }]);
    return extractJson(text) as CoachFeedback;
  }

  async generateHealthInsights(context: HealthInsightsContext): Promise<HealthInsights> {
    const text = await chat([{ role: "user", content: buildHealthInsightsPrompt(context) }]);
    return extractJson(text) as HealthInsights;
  }
}
