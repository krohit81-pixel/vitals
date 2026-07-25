import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditMealForm } from "../edit-meal-form";
import type { MealType } from "@/lib/nutrition/meal-type";

export default async function EditMealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meal } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!meal) notFound();

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Link
          href={`/meals/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Edit meal</h1>
      </div>

      <EditMealForm
        meal={{
          id: meal.id,
          mealType: meal.meal_type as MealType,
          loggedAtIso: meal.logged_at,
          calories: Math.round(Number(meal.calories)),
          proteinG: Math.round(Number(meal.protein_g)),
          carbsG: Math.round(Number(meal.carbs_g)),
          fatG: Math.round(Number(meal.fat_g)),
          fibreG: Math.round(Number(meal.fibre_g)),
          sugarG: Math.round(Number(meal.sugar_g)),
          sodiumMg: Math.round(Number(meal.sodium_mg)),
        }}
      />
    </div>
  );
}
