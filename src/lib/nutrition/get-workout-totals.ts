import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { datesInRange } from "./date";

type Client = SupabaseClient<Database>;

export interface WorkoutTotalsRow {
  date: string;
  caloriesBurned: number;
  workoutCount: number;
  durationMinutes: number;
}

export async function getWorkoutTotalsRange(
  supabase: Client,
  userId: string,
  start: string,
  end: string
): Promise<WorkoutTotalsRow[]> {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("date, calories_burned, duration_minutes")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  if (error) throw error;

  const byDate = new Map<string, { caloriesBurned: number; workoutCount: number; durationMinutes: number }>();
  for (const row of data ?? []) {
    const existing = byDate.get(row.date) ?? { caloriesBurned: 0, workoutCount: 0, durationMinutes: 0 };
    byDate.set(row.date, {
      caloriesBurned: existing.caloriesBurned + Number(row.calories_burned),
      workoutCount: existing.workoutCount + 1,
      durationMinutes: existing.durationMinutes + Number(row.duration_minutes),
    });
  }

  return datesInRange(start, end).map((date) => ({
    date,
    ...(byDate.get(date) ?? { caloriesBurned: 0, workoutCount: 0, durationMinutes: 0 }),
  }));
}

/** Total calories burned on a single date — used by the Dashboard's day view. */
export async function getWorkoutCaloriesForDate(
  supabase: Client,
  userId: string,
  date: string
): Promise<number> {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("calories_burned")
    .eq("user_id", userId)
    .eq("date", date);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.calories_burned), 0);
}
