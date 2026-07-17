export interface DetectedFoodItem {
  name: string;
  estimatedQuantity: string; // e.g. "1 cup", "150g", "2 pieces"
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number;
  sugarG: number;
  sodiumMg: number;
  confidence: number; // 0-1
}

export interface MealAnalysis {
  items: DetectedFoodItem[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fibreG: number;
    sugarG: number;
    sodiumMg: number;
  };
  overallConfidence: number; // 0-1
  // Each question carries its own answer options (2-4 short choices) rather
  // than assuming every ambiguity is yes/no — "Does this contain water or
  // milk?" needs "Water" / "Milk" / "Both", not a tick/cross.
  clarifyingQuestions: Array<{ id: string; question: string; options: string[] }>;
  explanation: string; // plain-language "estimated as: ..." summary
}

export interface CoachFeedback {
  summary: string;
  recommendations: string[];
}

export interface HealthInsightsContext {
  weightTrend?: { direction: "up" | "down" | "flat"; changeAmount: number; unit: string };
  restingHeartRateTrend?: { direction: "up" | "down" | "flat"; current: number };
  activityTrend?: { direction: "up" | "down" | "flat"; workoutsThisPeriod: number };
  nutritionConsistencyPct?: number;
  weekdayVsWeekendCalories?: { weekday: number; weekend: number };
}

export interface HealthInsights {
  insights: string[]; // short, concrete observations — not paragraphs
}

/**
 * Every provider (Gemini, OpenAI, Claude) implements this interface so the rest
 * of the app never depends on a specific vendor SDK.
 */
export interface AIProvider {
  /** Analyze a meal photo and return structured nutrition estimates. */
  analyzeMealImage(imageBase64: string, mimeType: string): Promise<MealAnalysis>;

  /** Parse free-text meal descriptions ("2 eggs and toast") into structured nutrition. */
  analyzeMealText(description: string): Promise<MealAnalysis>;

  /** Re-run estimation after the user answers low-confidence clarifying questions. */
  refineMealAnalysis(
    previous: MealAnalysis,
    answers: Array<{ question: string; answer: string }>
  ): Promise<MealAnalysis>;

  /** Generate supportive, evidence-based coaching feedback from a summary of recent intake. */
  generateCoachFeedback(context: CoachPromptContext): Promise<CoachFeedback>;

  /** Generate short, concrete observations for the Progress dashboard — weight/heart/activity/nutrition trends. */
  generateHealthInsights(context: HealthInsightsContext): Promise<HealthInsights>;
}

export interface CoachPromptContext {
  period: "daily" | "weekly";
  goals: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number };
  actuals: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number };
  proteinConsistencyPct?: number;
}
