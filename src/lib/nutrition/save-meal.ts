import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { MealAnalysis } from "@/lib/ai/types";
import type { MealType } from "./meal-type";
import { toDateString } from "./date";

type Client = SupabaseClient<Database>;

/** Recomputes daily_totals for a given date from the source-of-truth meal_logs rows. */
export async function recomputeDailyTotals(
  supabase: Client,
  userId: string,
  date: string
) {
  const { data: meals, error } = await supabase
    .from("meal_logs")
    .select("calories, protein_g, carbs_g, fat_g, fibre_g")
    .eq("user_id", userId)
    .gte("logged_at", `${date}T00:00:00`)
    .lte("logged_at", `${date}T23:59:59`);

  if (error) throw error;

  const totals = (meals ?? []).reduce(
    (acc, m) => ({
      calories: acc.calories + Number(m.calories),
      protein_g: acc.protein_g + Number(m.protein_g),
      carbs_g: acc.carbs_g + Number(m.carbs_g),
      fat_g: acc.fat_g + Number(m.fat_g),
      fibre_g: acc.fibre_g + Number(m.fibre_g),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0 }
  );

  const { error: upsertError } = await supabase
    .from("daily_totals")
    .upsert(
      { user_id: userId, date, ...totals },
      { onConflict: "user_id,date" }
    );

  if (upsertError) throw upsertError;
}

export interface PersistMealInput {
  userId: string;
  mealType: MealType;
  source: "photo" | "manual" | "voice";
  rawInput?: string;
  analysis: MealAnalysis;
  /** Storage path within the meal-photos bucket, if this meal came with a photo. */
  storagePath?: string;
}

export async function persistMeal(supabase: Client, input: PersistMealInput) {
  const { userId, mealType, source, rawInput, analysis, storagePath } = input;

  let mealImageId: string | null = null;
  if (storagePath) {
    const { data: image, error: imageError } = await supabase
      .from("meal_images")
      .insert({ user_id: userId, storage_path: storagePath })
      .select("id")
      .single();
    if (imageError) throw imageError;
    mealImageId = image.id;
  }

  const now = new Date();
  const { data: meal, error: mealError } = await supabase
    .from("meal_logs")
    .insert({
      user_id: userId,
      meal_image_id: mealImageId,
      meal_type: mealType,
      source,
      raw_input: rawInput ?? null,
      detected_items: analysis.items,
      calories: analysis.totals.calories,
      protein_g: analysis.totals.proteinG,
      carbs_g: analysis.totals.carbsG,
      fat_g: analysis.totals.fatG,
      fibre_g: analysis.totals.fibreG,
      sugar_g: analysis.totals.sugarG,
      sodium_mg: analysis.totals.sodiumMg,
      confidence: analysis.overallConfidence,
      ai_explanation: analysis.explanation,
      logged_at: now.toISOString(),
    })
    .select()
    .single();

  if (mealError) throw mealError;

  await recomputeDailyTotals(supabase, userId, toDateString(now));

  return meal;
}
