"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

/** `measuredAtIso` must be computed client-side (local time) — same
 * timezone-correctness reasoning as weight/water logging and meal timestamps. */
export async function logBloodPressureAction(
  systolic: number,
  diastolic: number,
  measuredAtIso: string,
  notes?: string
) {
  if (!Number.isFinite(systolic) || systolic <= 0) throw new Error("Enter a valid systolic (high) reading.");
  if (!Number.isFinite(diastolic) || diastolic <= 0) throw new Error("Enter a valid diastolic (low) reading.");

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("blood_pressure_logs").insert({
    user_id: userId,
    systolic,
    diastolic,
    measured_at: measuredAtIso,
    notes: notes || null,
  });
  if (error) throw error;

  revalidatePath("/blood-pressure");
}

export async function updateBloodPressureAction(
  id: string,
  systolic: number,
  diastolic: number,
  measuredAtIso: string,
  notes?: string
) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("blood_pressure_logs")
    .update({
      systolic,
      diastolic,
      measured_at: measuredAtIso,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/blood-pressure");
}

export async function deleteBloodPressureAction(id: string) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("blood_pressure_logs").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/blood-pressure");
  redirect("/blood-pressure");
}
