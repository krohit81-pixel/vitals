"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_LABEL_LENGTH = 50;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

function validateLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Enter something first.");
  if (trimmed.length > MAX_LABEL_LENGTH) {
    throw new Error(`Keep it to ${MAX_LABEL_LENGTH} characters or fewer.`);
  }
  return trimmed;
}

export async function createShortcutAction(label: string) {
  const { supabase, userId } = await requireUser();
  const clean = validateLabel(label);

  const { error } = await supabase.from("meal_shortcuts").insert({ user_id: userId, label: clean });
  if (error) throw error;

  revalidatePath("/profile/meal-shortcuts");
  revalidatePath("/meals/new");
}

export async function updateShortcutAction(id: string, label: string) {
  const { supabase, userId } = await requireUser();
  const clean = validateLabel(label);

  const { error } = await supabase
    .from("meal_shortcuts")
    .update({ label: clean })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/profile/meal-shortcuts");
  revalidatePath("/meals/new");
}

export async function deleteShortcutAction(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase.from("meal_shortcuts").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;

  revalidatePath("/profile/meal-shortcuts");
  revalidatePath("/meals/new");
}
