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
  "clarifyingQuestions": [
    { "id": string, "question": string, "options": string[] } // 2-4 short, concrete answer choices — NOT always "Yes"/"No". Pick options that actually fit the ambiguity: e.g. for "Does this protein shake contain water or milk?" use ["Water", "Milk", "Both", "Neither"], not a yes/no toggle. Only use ["Yes", "No"] when the question genuinely is binary, e.g. "Is this decaf?".
  ], // only if overallConfidence < 0.8
  "explanation": string // one short sentence, plain language, e.g. "Estimated as 2 eggs, whole wheat toast, butter, and black coffee."
}`;

export function buildImageAnalysisPrompt() {
  return `You are a nutrition estimation assistant. Look at this meal photo and identify every distinct food item, estimating its serving size and nutrition.

Rules:
- Estimate calories, protein, carbs, fat, fibre, sugar, and sodium per item, using realistic portion sizes based on visual cues (plate size, utensils, etc).
- Give each item its own confidence score (0-1) based on how certain you are of its identity and portion.
- If your overall confidence is below 0.8, include 1-3 short clarifying questions that would most improve accuracy, each with 2-4 concrete answer options that actually match the ambiguity — e.g. "Does this contain water or milk?" needs options like ["Water", "Milk", "Both"], not a yes/no toggle. Only use yes/no options when the question is genuinely binary (e.g. "Is this decaf?").
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
- If overall confidence is below 0.8, include 1-3 short clarifying questions, each with 2-4 concrete answer options matching the actual ambiguity (not a default yes/no).
- Respond with ONLY valid JSON matching exactly this shape, no markdown fences:

${MEAL_ANALYSIS_JSON_SHAPE}`;
}

export function buildRefinementPrompt(
  previousExplanation: string,
  items: Array<{ name: string; estimatedQuantity: string }>,
  answers: Array<{ question: string; answer: string }>
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

export function buildHealthInsightsPrompt(context: {
  weightTrend?: { direction: string; changeAmount: number; unit: string };
  restingHeartRateTrend?: { direction: string; current: number };
  activityTrend?: { direction: string; workoutsThisPeriod: number };
  nutritionConsistencyPct?: number;
  weekdayVsWeekendCalories?: { weekday: number; weekend: number };
}) {
  return `You are a health analytics assistant summarizing someone's recent trends across weight, heart rate, activity, and nutrition. Never diagnose, never give medical advice, never shame — just observe what the data shows, plainly and concisely.

Data available this period:
${context.weightTrend ? `- Weight: trending ${context.weightTrend.direction}, changed ${context.weightTrend.changeAmount} ${context.weightTrend.unit}` : ""}
${context.restingHeartRateTrend ? `- Resting heart rate: trending ${context.restingHeartRateTrend.direction}, currently ${context.restingHeartRateTrend.current} bpm` : ""}
${context.activityTrend ? `- Activity: trending ${context.activityTrend.direction}, ${context.activityTrend.workoutsThisPeriod} workouts logged` : ""}
${context.nutritionConsistencyPct !== undefined ? `- Nutrition consistency: ${context.nutritionConsistencyPct}% of days hit target` : ""}
${context.weekdayVsWeekendCalories ? `- Average calories: ${context.weekdayVsWeekendCalories.weekday} on weekdays vs ${context.weekdayVsWeekendCalories.weekend} on weekends` : ""}

Only comment on dimensions that actually have data above — never invent or assume a metric that isn't listed.

Write 2-4 short observations (one sentence each), each grounded in a specific number from above. No paragraphs, no filler, no "keep up the great work" filler — just what the data shows.

Respond with ONLY valid JSON: { "insights": string[] }. No markdown fences.`;
}
