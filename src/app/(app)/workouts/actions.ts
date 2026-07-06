"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutType } from "@/lib/nutrition/workout-type";

export interface WorkoutFormState {
  error: string | null;
}

function parseWorkoutForm(formData: FormData) {
  return {
    workout_type: String(formData.get("workout_type")) as WorkoutType,
    date: String(formData.get("date")),
    start_time: String(formData.get("start_time") || "00:00"),
    duration_minutes: Number(formData.get("duration_minutes") || 0),
    calories_burned: Number(formData.get("calories_burned") || 0),
    notes: String(formData.get("notes") || "") || null,
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function createWorkoutAction(
  _prevState: WorkoutFormState,
  formData: FormData
): Promise<WorkoutFormState> {
  const { supabase, userId } = await requireUser();
  const fields = parseWorkoutForm(formData);

  const { error } = await supabase.from("workout_logs").insert({
    user_id: userId,
    source: "manual",
    ...fields,
  });

  if (error) return { error: error.message };

  revalidatePath("/meals");
  revalidatePath("/dashboard");
  redirect("/meals");
}

export async function updateWorkoutAction(
  workoutId: string,
  _prevState: WorkoutFormState,
  formData: FormData
): Promise<WorkoutFormState> {
  const { supabase, userId } = await requireUser();
  const fields = parseWorkoutForm(formData);

  const { error } = await supabase
    .from("workout_logs")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", workoutId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/meals");
  revalidatePath("/dashboard");
  redirect("/meals");
}

export async function deleteWorkoutAction(workoutId: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("workout_logs")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", userId);

  if (error) throw error;

  revalidatePath("/meals");
  revalidatePath("/dashboard");
  redirect("/meals");
}
