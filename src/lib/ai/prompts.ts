export const MEAL_ANALYSIS_JSON_SHAPE = `{
  "items": [
    {
      "name": string,
      "estimatedQuantity": string,
      "calories": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number,
      "fibreG": number,
      "sugarG": number,
      "sodiumMg": number,
      "confidence": number // 0-1
    }
  ],
  "overallConfidence": number, // 0-1, weighted average across items
  "clarifyingQuestions": [ { "id": string, "question": string } ], // only if overallConfidence < 0.8
  "explanation": string // one short sentence, plain language, e.g. "Estimated as 2 eggs, whole wheat toast, butter, and black coffee."
}`;

export function buildImageAnalysisPrompt() {
  return `You are a nutrition estimation assistant. Look at this meal photo and identify every distinct food item, estimating its serving size and nutrition.

Rules:
- Estimate calories, protein, carbs, fat, fibre, sugar, and sodium per item, using realistic portion sizes based on visual cues (plate size, utensils, etc).
- Give each item its own confidence score (0-1) based on how certain you are of its identity and portion.
- If your overall confidence is below 0.8, include 1-3 short yes/no clarifying questions that would most improve accuracy (e.g. "Is this grilled or fried chicken?").
- Do not include any text outside the JSON object.
- Respond with ONLY valid JSON matching exactly this shape, no markdown fences:

${MEAL_ANALYSIS_JSON_SHAPE}`;
}

export function buildTextAnalysisPrompt(description: string) {
  return `You are a nutrition estimation assistant. A user described a meal in their own words:

"${description}"

Identify every distinct food item mentioned (accounting for regional dishes, e.g. Indian home cooking, if named), estimate realistic serving sizes, and estimate nutrition per item.

Rules:
- If quantity isn't stated, assume one typical serving.
- Give each item a confidence score (0-1).
- If overall confidence is below 0.8, include 1-3 short clarifying questions.
- Respond with ONLY valid JSON matching exactly this shape, no markdown fences:

${MEAL_ANALYSIS_JSON_SHAPE}`;
}

export function buildRefinementPrompt(
  previousExplanation: string,
  items: Array<{ name: string; estimatedQuantity: string }>,
  answers: Array<{ question: string; answer: "yes" | "no" }>
) {
  return `You previously estimated a meal as: ${previousExplanation}

Detected items: ${items.map((i) => `${i.name} (${i.estimatedQuantity})`).join(", ")}

The user answered your clarifying questions:
${answers.map((a) => `- "${a.question}" → ${a.answer}`).join("\n")}

Revise your nutrition estimate to account for these answers (e.g. adjust calories/fat if the user
confirmed something was fried instead of grilled, or full-fat instead of skim, etc). Your confidence
should now be higher since the user has confirmed key details — do not include further clarifying
questions unless something is still genuinely ambiguous.

Respond with ONLY valid JSON matching exactly this shape, no markdown fences:

${MEAL_ANALYSIS_JSON_SHAPE}`;
}

export function buildCoachPrompt(context: {
  period: "daily" | "weekly";
  goals: Record<string, number>;
  actuals: Record<string, number>;
  proteinConsistencyPct?: number;
}) {
  return `You are a supportive, evidence-based nutrition coach. Never shame the user or use alarmist language. Be specific and actionable.

Period: ${context.period}
Goals: ${JSON.stringify(context.goals)}
Actuals: ${JSON.stringify(context.actuals)}
${context.proteinConsistencyPct !== undefined ? `Protein goal consistency this week: ${context.proteinConsistencyPct}%` : ""}

Write:
1. A 2-3 sentence "summary" that's warm, specific, and grounded in the numbers above.
2. A "recommendations" array of 1-3 short, concrete, achievable suggestions.

Respond with ONLY valid JSON: { "summary": string, "recommendations": string[] }. No markdown fences.`;
}
