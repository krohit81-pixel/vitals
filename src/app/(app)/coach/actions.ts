"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import type { CoachPromptContext } from "@/lib/ai/types";

/**
 * Coach feedback is now generated on-demand (button press) rather than on
 * every page load — this is the only place that spends an LLM call. Each
 * generation is persisted to `ai_feedback` so the page can show the last
 * result (with its timestamp) without re-calling the model.
 */
export async function generateCoachFeedbackAction(context: CoachPromptContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const feedback = await getAIProvider().generateCoachFeedback(context);

  const { data, error } = await supabase
    .from("ai_feedback")
    .insert({
      user_id: user.id,
      period: context.period,
      summary: feedback.summary,
      recommendations: feedback.recommendations,
    })
    .select("summary, recommendations, created_at")
    .single();

  if (error) throw error;

  revalidatePath("/coach");
  return data;
}
