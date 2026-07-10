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
 * timezone-correctness reasoning as water logging and meal timestamps. */
export async function logWeightAction(weight: number, unit: "kg" | "lb", measuredAtIso: string) {
  if (!Number.isFinite(weight) || weight <= 0) throw new Error("Enter a valid weight.");

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("weight_logs").insert({
    user_id: userId,
    weight,
    unit,
    measured_at: measuredAtIso,
  });
  if (error) throw error;

  revalidatePath("/progress");
  revalidatePath("/weight");
  revalidatePath("/dashboard");
}

export async function deleteWeightLogAction(id: string) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("weight_logs").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/progress");
  revalidatePath("/weight");
  redirect("/weight");
}

export async function updateWeightLogAction(
  id: string,
  weight: number,
  unit: "kg" | "lb",
  measuredAtIso: string,
  notes?: string
) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("weight_logs")
    .update({ weight, unit, measured_at: measuredAtIso, notes: notes || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/progress");
  revalidatePath("/weight");
}
