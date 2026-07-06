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
  clarifyingQuestions: Array<{ id: string; question: string }>; // asked when confidence < 0.8
  explanation: string; // plain-language "estimated as: ..." summary
}

export interface CoachFeedback {
  summary: string;
  recommendations: string[];
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
    answers: Array<{ question: string; answer: "yes" | "no" }>
  ): Promise<MealAnalysis>;

  /** Generate supportive, evidence-based coaching feedback from a summary of recent intake. */
  generateCoachFeedback(context: CoachPromptContext): Promise<CoachFeedback>;
}

export interface CoachPromptContext {
  period: "daily" | "weekly";
  goals: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number };
  actuals: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number };
  proteinConsistencyPct?: number;
}
