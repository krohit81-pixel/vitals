"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface GoalsFormState {
  error: string | null;
}

export async function updateGoalsAction(
  _prevState: GoalsFormState,
  formData: FormData
): Promise<GoalsFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const numeric = (key: string) => Number(formData.get(key) ?? 0);

  const { error } = await supabase
    .from("goals")
    .update({
      calorie_target: numeric("calorie_target"),
      protein_target_g: numeric("protein_target_g"),
      carb_target_g: numeric("carb_target_g"),
      fat_target_g: numeric("fat_target_g"),
      fibre_target_g: numeric("fibre_target_g"),
      water_target_ml: numeric("water_target_ml"),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile");
}
