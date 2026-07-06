import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { datesInRange } from "./date";

type Client = SupabaseClient<Database>;

export interface DailyTotalsRow {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  water_ml: number;
}

/** Daily totals for every date in [start, end], inclusive — zero-filled for days with no data. */
export async function getDailyTotalsRange(
  supabase: Client,
  userId: string,
  start: string,
  end: string
): Promise<DailyTotalsRow[]> {
  const { data, error } = await supabase
    .from("daily_totals")
    .select("date, calories, protein_g, carbs_g, fat_g, fibre_g, water_ml")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  if (error) throw error;

  const byDate = new Map<string, DailyTotalsRow>(
    (data ?? []).map((row) => [
      row.date,
      {
        date: row.date,
        calories: Number(row.calories),
        protein_g: Number(row.protein_g),
        carbs_g: Number(row.carbs_g),
        fat_g: Number(row.fat_g),
        fibre_g: Number(row.fibre_g),
        water_ml: Number(row.water_ml),
      },
    ])
  );

  return datesInRange(start, end).map(
    (date) =>
      byDate.get(date) ?? {
        date,
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fibre_g: 0,
        water_ml: 0,
      }
  );
}
