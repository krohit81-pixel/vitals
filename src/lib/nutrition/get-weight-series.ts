import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export interface WeightPoint {
  date: string;
  value: number;
  unit: "kg" | "lb";
}

/** All weight readings in [start, end], oldest first — for a sparkline and a
 * "since the start of this period" delta. Unlike daily nutrition totals this
 * is sparse (people don't weigh in daily), so no zero-filling: a gap in the
 * chart just means no reading that day, not a reading of zero. */
export async function getWeightSeries(supabase: Client, userId: string, start: string, end: string): Promise<WeightPoint[]> {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("weight, unit, measured_at")
    .eq("user_id", userId)
    .gte("measured_at", `${start}T00:00:00`)
    .lte("measured_at", `${end}T23:59:59`)
    .order("measured_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    date: row.measured_at.slice(0, 10),
    value: Number(row.weight),
    unit: row.unit as "kg" | "lb",
  }));
}
