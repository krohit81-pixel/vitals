import Link from "next/link";
import { UtensilsCrossed, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { MealCard, type MealCardData } from "@/components/shared/meal-card";
import { type MealType } from "@/lib/nutrition/meal-type";

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function MealsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meals } = await supabase
    .from("meal_logs")
    .select("id, meal_type, calories, protein_g, carbs_g, fat_g, logged_at, detected_items")
    .eq("user_id", user!.id)
    .gte("logged_at", startOfTodayISO())
    .order("logged_at", { ascending: false });

  const cards: MealCardData[] = (meals ?? []).map((m) => {
    const items = (m.detected_items ?? []) as Array<{ name: string }>;
    const name = items.length > 0 ? items.map((i) => i.name).join(", ") : "Meal";

    return {
      id: m.id,
      type: (m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)) as MealCardData["type"],
      name,
      time: new Date(m.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      calories: Math.round(Number(m.calories)),
      proteinG: Math.round(Number(m.protein_g)),
      carbsG: Math.round(Number(m.carbs_g)),
      fatG: Math.round(Number(m.fat_g)),
    };
  });

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">Meals</h1>
        <Link
          href="/meals/new?mode=manual"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white"
        >
          <Plus size={18} />
        </Link>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meals logged yet today"
          description="Tap the + button to log your first meal — by photo, voice, or just typing what you ate."
        />
      ) : (
        <div className="space-y-2.5">
          {cards.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      )}
    </div>
  );
}
