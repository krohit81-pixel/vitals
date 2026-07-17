import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { NewMealFlow } from "./new-meal-flow";

export default async function NewMealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shortcuts } = await supabase
    .from("meal_shortcuts")
    .select("label")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  return (
    <Suspense fallback={<div className="skeleton h-64 w-full" />}>
      <NewMealFlow shortcuts={(shortcuts ?? []).map((s) => s.label)} />
    </Suspense>
  );
}
