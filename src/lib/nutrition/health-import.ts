import type { WorkoutType } from "./workout-type";

export interface RawHealthRecord {
  date: string;
  metric: string;
  value: number;
  unit: string;
  source: string;
}

export interface ParsedImport {
  metricRows: Array<{ metric: string; value: number; unit: string; source: string; recordedAt: string; recordedDate: string }>;
  workouts: Array<{
    workoutType: WorkoutType;
    date: string; // YYYY-MM-DD, wall-clock
    startTime: string; // HH:MM, wall-clock
    durationMinutes: number;
    caloriesBurned: number;
    healthWorkoutId: string;
  }>;
  skippedCount: number;
}

/** Validates the raw upload is at least shaped like a HealthSave export — doesn't
 * trust metric names or units beyond that, since new metric types should flow
 * through without code changes. */
export function isValidExport(data: unknown): data is RawHealthRecord[] {
  return (
    Array.isArray(data) &&
    data.every(
      (d) =>
        d &&
        typeof d.date === "string" &&
        typeof d.metric === "string" &&
        typeof d.value === "number" &&
        typeof d.unit === "string" &&
        typeof d.source === "string"
    )
  );
}

/** Extracts literal wall-clock date/time from an ISO string, ignoring any
 * timezone offset — same reasoning as elsewhere in the app: we want "what the
 * clock said" where the reading happened, not a reinterpretation through
 * whatever timezone the import happens to run in. */
function wallClock(iso: string): { date: string; time: string } | null {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return match ? { date: match[1]!, time: match[2]! } : null;
}

function normalizeWorkoutType(raw: string): WorkoutType {
  const s = raw.toLowerCase();
  if (s.includes("run")) return "running";
  if (s.includes("walk")) return "walking";
  if (s.includes("elliptical")) return "elliptical";
  if (s.includes("cycl") || s.includes("bik")) return "cycling";
  if (s.includes("swim")) return "swimming";
  if (s.includes("strength") || s.includes("weight")) return "strength_training";
  if (s.includes("hiit") || s.includes("interval")) return "hiit";
  if (s.includes("yoga")) return "yoga";
  if (s.includes("row")) return "rowing";
  if (s.includes("hik")) return "hiking";
  return "other";
}

/**
 * Splits a raw export into (a) plain time-series metric rows destined for
 * `health_metrics`, and (b) workout sessions destined for `workout_logs` —
 * HealthSave reports each workout as a `workout_duration` + `workout_calories`
 * pair sharing the same timestamp, with the workout type embedded in the
 * source string, e.g. "Rohit's Apple Watch (Elliptical)".
 */
export function parseHealthExport(records: RawHealthRecord[]): ParsedImport {
  const metricRows: ParsedImport["metricRows"] = [];
  const workoutBuckets = new Map<string, { duration?: number; calories?: number; type: string; date: string }>();
  let skipped = 0;

  for (const r of records) {
    const clock = wallClock(r.date);
    if (!clock) {
      skipped++;
      continue;
    }

    if (r.metric === "workout_duration" || r.metric === "workout_calories") {
      const typeMatch = r.source.match(/\(([^)]+)\)/);
      const type = typeMatch ? typeMatch[1]! : "Other";
      const key = `${r.date}__${r.source}`;
      const bucket = workoutBuckets.get(key) ?? { type, date: r.date };
      if (r.metric === "workout_duration") bucket.duration = r.value;
      else bucket.calories = r.value;
      workoutBuckets.set(key, bucket);
      continue;
    }

    metricRows.push({
      metric: r.metric,
      value: r.value,
      unit: r.unit,
      source: r.source,
      recordedAt: r.date,
      recordedDate: clock.date,
    });
  }

  const workouts: ParsedImport["workouts"] = [];
  for (const [key, bucket] of workoutBuckets) {
    const clock = wallClock(bucket.date);
    if (!clock || bucket.duration === undefined || bucket.calories === undefined) {
      skipped++;
      continue;
    }
    workouts.push({
      workoutType: normalizeWorkoutType(bucket.type),
      date: clock.date,
      startTime: clock.time,
      durationMinutes: Math.round(bucket.duration),
      caloriesBurned: Math.round(bucket.calories),
      healthWorkoutId: key,
    });
  }

  return { metricRows, workouts, skippedCount: skipped };
}
