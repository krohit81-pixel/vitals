"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recomputeDailyTotals } from "@/lib/nutrition/save-meal";
import { toDateString } from "@/lib/nutrition/date";
import type { MealType } from "@/lib/nutrition/meal-type";

export interface UpdateMealArgs {
  mealType: MealType;
  loggedAt: string; // ISO instant, converted from viewer-local time on the client
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number;
  sugarG: number;
  sodiumMg: number;
}

export async function updateMealAction(mealId: string, args: UpdateMealArgs) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing, error: fetchError } = await supabase
    .from("meal_logs")
    .select("logged_at")
    .eq("id", mealId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) throw new Error("Meal not found");

  const { error: updateError } = await supabase
    .from("meal_logs")
    .update({
      meal_type: args.mealType,
      logged_at: args.loggedAt,
      calories: args.calories,
      protein_g: args.proteinG,
      carbs_g: args.carbsG,
      fat_g: args.fatG,
      fibre_g: args.fibreG,
      sugar_g: args.sugarG,
      sodium_mg: args.sodiumMg,
    })
    .eq("id", mealId)
    .eq("user_id", user.id);

  if (updateError) throw updateError;

  // Recompute both the old and (if it changed) the new day's totals — an
  // edit can move a meal across midnight, and either day's total could now
  // be stale otherwise.
  const oldDate = toDateString(new Date(existing.logged_at));
  const newDate = toDateString(new Date(args.loggedAt));
  await recomputeDailyTotals(supabase, user.id, oldDate);
  if (newDate !== oldDate) {
    await recomputeDailyTotals(supabase, user.id, newDate);
  }

  revalidatePath("/meals");
  revalidatePath("/dashboard");
  revalidatePath(`/meals/${mealId}`);
  redirect(`/meals/${mealId}`);
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

  await recomputeDailyTotals(supabase, user.id, toDateString(new Date(meal.logged_at)));

  revalidatePath("/meals");
  revalidatePath("/dashboard");
  redirect("/meals");
}
