"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recomputeDailyTotals } from "@/lib/nutrition/save-meal";

function dateStringOf(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function deleteMealAction(mealId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: meal, error: fetchError } = await supabase
    .from("meal_logs")
    .select("logged_at, meal_image_id")
    .eq("id", mealId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !meal) throw new Error("Meal not found");

  const { error: deleteError } = await supabase
    .from("meal_logs")
    .delete()
    .eq("id", mealId)
    .eq("user_id", user.id);

  if (deleteError) throw deleteError;

  // Best-effort cleanup of the associated photo — not fatal if it fails.
  if (meal.meal_image_id) {
    const { data: image } = await supabase
      .from("meal_images")
      .select("storage_path")
      .eq("id", meal.meal_image_id)
      .single();
    if (image?.storage_path) {
      await supabase.storage.from("meal-photos").remove([image.storage_path]);
    }
    await supabase.from("meal_images").delete().eq("id", meal.meal_image_id);
  }

  await recomputeDailyTotals(supabase, user.id, dateStringOf(meal.logged_at));

  revalidatePath("/meals");
  revalidatePath("/dashboard");
  redirect("/meals");
}
