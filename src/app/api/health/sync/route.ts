import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { hashSyncToken, extractWorkoutFields } from "@/lib/nutrition/health-sync";
import type { WorkoutType } from "@/lib/nutrition/workout-type";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json({ error: "Missing Authorization: Bearer <token> header" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const tokenHash = hashSyncToken(token);

  const { data: settings } = await supabase
    .from("settings")
    .select("user_id, health_connected")
    .eq("health_sync_token_hash", tokenHash)
    .single();

  if (!settings || !settings.health_connected) {
    return NextResponse.json({ error: "Invalid or revoked sync token" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  // Accepts the raw Health-sample dictionaries straight from Shortcuts' "Find
  // Health Samples" action — no manual field-mapping required on the phone.
  // Field-name/format tolerance lives in extractWorkoutFields(), not here.
  const rawWorkouts: Record<string, unknown>[] = Array.isArray(body?.workouts) ? body.workouts : [];

  if (rawWorkouts.length === 0) {
    return NextResponse.json({ error: "Expected a non-empty `workouts` array" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;

  for (const raw of rawWorkouts) {
    const workout = extractWorkoutFields(raw);
    if (!workout) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("workout_logs").upsert(
      {
        user_id: settings.user_id,
        workout_type: workout.workoutType as WorkoutType,
        date: workout.date,
        start_time: workout.startTime,
        duration_minutes: workout.durationMinutes,
        calories_burned: workout.caloriesBurned,
        source: "apple_health",
        health_workout_id: workout.healthWorkoutId,
      },
      { onConflict: "user_id,health_workout_id", ignoreDuplicates: true }
    );

    if (error) skipped++;
    else imported++;
  }

  await supabase
    .from("settings")
    .update({ health_last_sync_at: new Date().toISOString() })
    .eq("user_id", settings.user_id);

  return NextResponse.json({ imported, skipped, total: rawWorkouts.length });
}
