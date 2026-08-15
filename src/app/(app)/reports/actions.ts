"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ScoreBreakdownItem } from "@/components/progress/score-breakdown";

/**
 * Weekly Reports are fully deterministic — computed from meal/workout/health
 * data already in the database, not an AI call (see documents/CHANGES.md for
 * why this was scoped that way). "Generate" just snapshots the current
 * numbers into `weekly_reports` so a given week's report stays stable and has
 * a "last generated at" timestamp, same on-demand pattern as ai_feedback /
 * health_insights. Unlike those two, a week has a natural stable identity —
 * this upserts onto (user_id, week_start) instead of inserting a new row
 * every time.
 */
export async function generateWeeklyReportAction(input: {
  weekStart: string;
  weekEnd: string;
  focusAreas: ScoreBreakdownItem[];
  accomplishments: string[];
  upcomingFocus: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("weekly_reports")
    .upsert(
      {
        user_id: user.id,
        week_start: input.weekStart,
        week_end: input.weekEnd,
        focus_areas: input.focusAreas,
        accomplishments: input.accomplishments,
        upcoming_focus: input.upcomingFocus,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,week_start" }
    )
    .select("generated_at")
    .single();

  if (error) throw error;

  revalidatePath("/reports");
  return data;
}
