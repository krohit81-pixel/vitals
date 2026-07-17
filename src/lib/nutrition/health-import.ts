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

/**
 * Converts a genuinely-UTC HealthSave timestamp (the `Z` suffix means it) into
 * the wall-clock date/time in the *viewer's* timezone. This is different from
 * the wallClock()-style literal-digit-extraction used elsewhere in the app
 * (e.g. for meal timestamps) — those are correct because this app's own
 * timestamps are already local when created. HealthSave's export timestamps
 * are real UTC instants, so they need an actual conversion, not just reading
 * the digits off the string. `timeZone` must be captured client-side (see
 * the health-import page) — the server has no way to know the viewer's zone.
 */
function utcToZonedWallClock(isoUtc: string, timeZone: string): { date: string; time: string } | null {
  const instant = new Date(isoUtc);
  if (isNaN(instant.getTime())) return null;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(instant);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const hour = get("hour") === "24" ? "00" : get("hour"); // some ICU implementations use 24 instead of 00 for midnight
    return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${hour}:${get("minute")}` };
  } catch {
    // Invalid/unrecognized timeZone string — fall back to literal digit
    // extraction rather than failing the whole import over one bad value.
    const match = isoUtc.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    return match ? { date: match[1]!, time: match[2]! } : null;
  }
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

export interface ManualWorkoutSummary {
  date: string;
  startTime: string; // HH:MM
  workoutType: string;
  durationMinutes: number;
}

function minutesSinceMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Best-effort match between an imported workout and an already-existing
 * manual entry — same day, close start time, compatible type, similar
 * duration. Deliberately conservative (fairly tight tolerances) rather than
 * aggressive: a missed match just means one importable duplicate slips
 * through (annoying, easy to delete by hand), while a false-positive match
 * would silently drop a real second workout — the worse failure mode of the
 * two, so tolerances lean toward avoiding that.
 */
export function isLikelyDuplicateOfManual(
  candidate: { date: string; startTime: string; workoutType: string; durationMinutes: number },
  manual: ManualWorkoutSummary
): boolean {
  if (candidate.date !== manual.date) return false;

  const timeDiff = Math.abs(minutesSinceMidnight(candidate.startTime) - minutesSinceMidnight(manual.startTime));
  if (timeDiff > 60) return false;

  const typeCompatible =
    candidate.workoutType === manual.workoutType || candidate.workoutType === "other" || manual.workoutType === "other";
  if (!typeCompatible) return false;

  const durationDiff = Math.abs(candidate.durationMinutes - manual.durationMinutes);
  const durationTolerance = Math.max(candidate.durationMinutes * 0.4, 10);
  if (durationDiff > durationTolerance) return false;

  return true;
}

/**
 * Splits a raw export into (a) plain time-series metric rows destined for
 * `health_metrics`, and (b) workout sessions destined for `workout_logs` —
 * HealthSave reports each workout as a `workout_duration` + `workout_calories`
 * pair sharing the same timestamp, with the workout type embedded in the
 * source string, e.g. "Rohit's Apple Watch (Elliptical)".
 */
export function parseHealthExport(records: RawHealthRecord[], timeZone: string): ParsedImport {
  const metricRows: ParsedImport["metricRows"] = [];
  const workoutBuckets = new Map<string, { duration?: number; calories?: number; type: string; date: string }>();
  let skipped = 0;

  for (const r of records) {
    const clock = utcToZonedWallClock(r.date, timeZone);
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
    const clock = utcToZonedWallClock(bucket.date, timeZone);
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
