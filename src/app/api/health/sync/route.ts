import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { hashSyncToken, normalizeWorkoutType } from "@/lib/nutrition/health-sync";
import type { WorkoutType } from "@/lib/nutrition/workout-type";

interface IncomingWorkout {
  workoutType?: string;
  date?: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  durationMinutes?: number;
  caloriesBurned?: number;
  healthWorkoutId?: string;
}

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
  const workouts: IncomingWorkout[] = Array.isArray(body?.workouts) ? body.workouts : [];

  if (workouts.length === 0) {
    return NextResponse.json({ error: "Expected a non-empty `workouts` array" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;

  for (const w of workouts) {
    if (!w.healthWorkoutId || !w.date || !w.workoutType) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("workout_logs").upsert(
      {
        user_id: settings.user_id,
        workout_type: normalizeWorkoutType(w.workoutType) as WorkoutType,
        date: w.date,
        start_time: w.startTime ?? "00:00",
        duration_minutes: Math.max(0, Math.round(w.durationMinutes ?? 0)),
        calories_burned: Math.max(0, Math.round(w.caloriesBurned ?? 0)),
        source: "apple_health",
        health_workout_id: w.healthWorkoutId,
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

  return NextResponse.json({ imported, skipped });
}
