import type { DetectedFoodItem, MealAnalysis } from "./types";

export function extractJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```json\s*|^```\s*|```$/g, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    // Some models wrap JSON in prose despite instructions — grab the first {...} block.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Model response was not valid JSON");
  }
}

export function toMealAnalysis(parsed: {
  items: DetectedFoodItem[];
  overallConfidence: number;
  clarifyingQuestions?: Array<{ id: string; question: string }>;
  explanation: string;
}): MealAnalysis {
  const totals = parsed.items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      proteinG: acc.proteinG + (item.proteinG || 0),
      carbsG: acc.carbsG + (item.carbsG || 0),
      fatG: acc.fatG + (item.fatG || 0),
      fibreG: acc.fibreG + (item.fibreG || 0),
      sugarG: acc.sugarG + (item.sugarG || 0),
      sodiumMg: acc.sodiumMg + (item.sodiumMg || 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0, sugarG: 0, sodiumMg: 0 }
  );

  return {
    items: parsed.items,
    totals,
    overallConfidence: parsed.overallConfidence,
    clarifyingQuestions: parsed.clarifyingQuestions ?? [],
    explanation: parsed.explanation,
  };
}
