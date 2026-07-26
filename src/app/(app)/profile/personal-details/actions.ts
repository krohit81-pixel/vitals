"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PersonalDetailsFormState {
  error: string | null;
}

export async function updatePersonalDetailsAction(
  _prevState: PersonalDetailsFormState,
  formData: FormData
): Promise<PersonalDetailsFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const fullName = ((formData.get("full_name") as string) || "").trim() || null;
  const ageRaw = formData.get("age") as string;
  const heightRaw = formData.get("height_cm") as string;
  const weightRaw = formData.get("weight_kg") as string;
  const allergiesRaw = (formData.get("allergies") as string) ?? "";

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      age: ageRaw ? Number(ageRaw) : null,
      gender: formData.get("gender") as "male" | "female" | "other" | "prefer_not_to_say",
      height_cm: heightRaw ? Number(heightRaw) : null,
      weight_kg: weightRaw ? Number(weightRaw) : null,
      activity_level: formData.get("activity_level") as
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active",
      diet_type: formData.get("diet_type") as "vegetarian" | "vegan" | "non_vegetarian",
      units: formData.get("units") as "metric" | "imperial",
      allergies: allergiesRaw
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Coach and Progress read these fields to tailor their AI feedback/insights.
  revalidatePath("/profile");
  revalidatePath("/coach");
  revalidatePath("/progress");
  redirect("/profile");
}
