"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import type { MealAnalysis } from "@/lib/ai/types";
import { persistMeal } from "@/lib/nutrition/save-meal";
import type { MealType } from "@/lib/nutrition/meal-type";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function analyzeMealPhotoAction(
  imageBase64: string,
  mimeType: string
): Promise<MealAnalysis> {
  await requireUser(); // ensures only signed-in users can spend API credits
  return getAIProvider().analyzeMealImage(imageBase64, mimeType);
}

export async function analyzeMealTextAction(description: string): Promise<MealAnalysis> {
  await requireUser();
  return getAIProvider().analyzeMealText(description);
}

export async function refineWithClarificationAction(
  previous: MealAnalysis,
  answers: Array<{ question: string; answer: string }>
): Promise<MealAnalysis> {
  await requireUser();
  return getAIProvider().refineMealAnalysis(previous, answers);
}

export interface SaveMealArgs {
  mealType: MealType;
  source: "photo" | "manual" | "voice";
  rawInput?: string;
  analysis: MealAnalysis;
  /** Present only when source === "photo". */
  imageBase64?: string;
  imageMimeType?: string;
}

export async function saveMealAction(args: SaveMealArgs) {
  const { supabase, userId } = await requireUser();

  let storagePath: string | undefined;
  if (args.imageBase64 && args.imageMimeType) {
    const ext = args.imageMimeType.split("/")[1] ?? "jpg";
    storagePath = `${userId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(args.imageBase64, "base64");

    const { error: uploadError } = await supabase.storage
      .from("meal-photos")
      .upload(storagePath, buffer, { contentType: args.imageMimeType });

    if (uploadError) throw uploadError;
  }

  const meal = await persistMeal(supabase, {
    userId,
    mealType: args.mealType,
    source: args.source,
    rawInput: args.rawInput,
    analysis: args.analysis,
    storagePath,
  });

  revalidatePath("/meals");
  revalidatePath("/dashboard");

  return meal;
}
