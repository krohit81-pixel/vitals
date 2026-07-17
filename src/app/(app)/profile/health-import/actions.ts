"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidExport, parseHealthExport, isLikelyDuplicateOfManual } from "@/lib/nutrition/health-import";

const CHUNK_SIZE = 500;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export interface ImportResult {
  error?: string;
  metricsImported?: number;
  workoutsImported?: number;
  duplicatesSkipped?: number;
  skipped?: number;
}

export async function importHealthDataAction(_prev: ImportResult, formData: FormData): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file selected" };

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    return { error: "That file isn't valid JSON — check it's the unmodified HealthSave export." };
  }

  if (!isValidExport(raw)) {
    return { error: "That JSON doesn't look like a HealthSave export (expected date/metric/value/unit/source fields)." };
  }

  // Captured client-side (see page.tsx) via Intl.DateTimeFormat().resolvedOptions().timeZone —
  // the server has no way to know the viewer's actual timezone otherwise.
  // HealthSave's timestamps are genuinely UTC, so this is required to convert
  // them to the correct local date/time rather than misreading UTC digits as
  // if they were already local (the bug this fixes).
  const timeZone = String(formData.get("timeZone") || "UTC");

  const { metricRows, workouts, skippedCount } = parseHealthExport(raw, timeZone);

  // Cross-source duplicate check: the health_workout_id dedup constraint only
  // catches re-importing the same export twice — it can't recognize that an
  // imported workout and an already-existing *manual* entry describe the same
  // real session, since the manual one has no health_workout_id at all. Fetch
  // the user's manual entries on the dates this import touches, and skip
  // importing anything that looks like a match (see isLikelyDuplicateOfManual
  // for the exact tolerances).
  const importDates = [...new Set(workouts.map((w) => w.date))];
  const { data: manualWorkouts } =
    importDates.length > 0
      ? await supabase
          .from("workout_logs")
          .select("date, start_time, workout_type, duration_minutes")
          .eq("user_id", user.id)
          .eq("source", "manual")
          .in("date", importDates)
      : { data: [] };

  let duplicatesSkipped = 0;
  const workoutsToImport = workouts.filter((w) => {
    const isDuplicate = (manualWorkouts ?? []).some((m) =>
      isLikelyDuplicateOfManual(w, {
        date: m.date,
        startTime: m.start_time.slice(0, 5),
        workoutType: m.workout_type,
        durationMinutes: m.duration_minutes,
      })
    );
    if (isDuplicate) duplicatesSkipped++;
    return !isDuplicate;
  });

  let metricsImported = 0;
  for (const batch of chunk(metricRows, CHUNK_SIZE)) {
    const { error, count } = await supabase
      .from("health_metrics")
      .upsert(
        batch.map((r) => ({
          user_id: user.id,
          metric: r.metric,
          value: r.value,
          unit: r.unit,
          source: r.source,
          recorded_at: r.recordedAt,
          recorded_date: r.recordedDate,
        })),
        { onConflict: "user_id,metric,recorded_at,source", ignoreDuplicates: true, count: "exact" }
      );
    if (!error) metricsImported += count ?? batch.length;
  }

  let workoutsImported = 0;
  for (const batch of chunk(workoutsToImport, CHUNK_SIZE)) {
    const { error, count } = await supabase
      .from("workout_logs")
      .upsert(
        batch.map((w) => ({
          user_id: user.id,
          workout_type: w.workoutType,
          date: w.date,
          start_time: w.startTime,
          duration_minutes: w.durationMinutes,
          calories_burned: w.caloriesBurned,
          source: "apple_health" as const,
          health_workout_id: w.healthWorkoutId,
        })),
        { onConflict: "user_id,health_workout_id", ignoreDuplicates: true, count: "exact" }
      );
    if (!error) workoutsImported += count ?? batch.length;
  }

  revalidatePath("/progress");
  revalidatePath("/dashboard");
  revalidatePath("/meals");

  return { metricsImported, workoutsImported, duplicatesSkipped, skipped: skippedCount };
}
