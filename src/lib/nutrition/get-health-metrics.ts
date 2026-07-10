import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { datesInRange } from "./date";

type Client = SupabaseClient<Database>;

const DEDUPED_SOURCE = "Total (deduplicated)";

export interface DailyMetricPoint {
  date: string;
  value: number;
}

/**
 * One value per day for a metric over a range. HealthSave often reports the
 * same cumulative metric (steps, distance, flights, active energy) from
 * multiple sources — phone, watch, and a pre-computed "Total (deduplicated)"
 * — for the same day. Preferring that deduplicated total when it exists
 * avoids double-counting; days without it fall back to averaging whatever
 * sources are present (mainly relevant for point-in-time metrics like heart
 * rate, which have no "total" concept and are naturally averaged instead).
 */
export async function getDailyMetricSeries(
  supabase: Client,
  userId: string,
  metric: string,
  start: string,
  end: string
): Promise<DailyMetricPoint[]> {
  const { data, error } = await supabase
    .from("health_metrics")
    .select("recorded_date, value, source")
    .eq("user_id", userId)
    .eq("metric", metric)
    .gte("recorded_date", start)
    .lte("recorded_date", end);

  if (error) throw error;

  const byDate = new Map<string, { total: number[]; other: number[] }>();
  for (const row of data ?? []) {
    const bucket = byDate.get(row.recorded_date) ?? { total: [], other: [] };
    if (row.source === DEDUPED_SOURCE) bucket.total.push(Number(row.value));
    else bucket.other.push(Number(row.value));
    byDate.set(row.recorded_date, bucket);
  }

  return datesInRange(start, end).map((date) => {
    const bucket = byDate.get(date);
    if (!bucket || (bucket.total.length === 0 && bucket.other.length === 0)) {
      return { date, value: 0 };
    }
    const values = bucket.total.length > 0 ? bucket.total : bucket.other;
    const value = values.reduce((sum, v) => sum + v, 0) / values.length;
    return { date, value };
  });
}

export interface MetricStats {
  average: number;
  min: number;
  max: number;
  latest: number | null;
}

export function summarizeSeries(series: DailyMetricPoint[]): MetricStats {
  const nonZero = series.filter((p) => p.value > 0);
  if (nonZero.length === 0) return { average: 0, min: 0, max: 0, latest: null };
  const values = nonZero.map((p) => p.value);
  return {
    average: values.reduce((sum, v) => sum + v, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    latest: nonZero[nonZero.length - 1]!.value,
  };
}

/** Most recent single reading for a metric, regardless of date range — used
 * for "current" values like today's resting heart rate. */
export async function getLatestMetricValue(
  supabase: Client,
  userId: string,
  metric: string
): Promise<number | null> {
  const { data } = await supabase
    .from("health_metrics")
    .select("value")
    .eq("user_id", userId)
    .eq("metric", metric)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? Number(data.value) : null;
}
