import type { AIProvider } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";
import { ClaudeProvider } from "./providers/claude";

export type { AIProvider, MealAnalysis, DetectedFoodItem, CoachFeedback } from "./types";

let cached: AIProvider | null = null;

/**
 * Returns the configured AI provider. The rest of the app should only ever
 * import from this file, never from a specific provider module — that's what
 * makes providers interchangeable via AI_PROVIDER without touching call sites.
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const selected = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();

  switch (selected) {
    case "gemini":
      cached = new GeminiProvider();
      break;
    case "openai":
      cached = new OpenAIProvider();
      break;
    case "claude":
      cached = new ClaudeProvider();
      break;
    default:
      throw new Error(`Unknown AI_PROVIDER: "${selected}". Use gemini | openai | claude.`);
  }

  return cached;
}
