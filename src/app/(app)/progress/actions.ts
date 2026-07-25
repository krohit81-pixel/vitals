"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import type { HealthInsightsContext } from "@/lib/ai";

/**
 * Same on-demand pattern as the Coach's ai_feedback: insights are only
 * (re)generated when the user taps the button, and persisted to
 * health_insights so the card can show the last result plus its timestamp
 * without spending another LLM call on every page load.
 */
export async function generateHealthInsightsAction(context: HealthInsightsContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const result = await getAIProvider().generateHealthInsights(context);

  const { data, error } = await supabase
    .from("health_insights")
    .insert({ user_id: user.id, insights: result.insights })
    .select("insights, created_at")
    .single();

  if (error) throw error;

  revalidatePath("/progress");
  return data;
}
