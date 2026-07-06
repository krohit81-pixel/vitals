import Link from "next/link";
import { UtensilsCrossed, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { MealCard, type MealCardData } from "@/components/shared/meal-card";
import { WaterSummaryCard } from "@/components/meals/water-summary-card";
import { MEAL_TYPE_LABELS, type MealType } from "@/lib/nutrition/meal-type";
import { ProfileMenuButton } from "@/components/navigation/profile-menu-button";
import { DateNavigator } from "@/components/shared/date-navigator";

const SECTION_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  // Rough server-side guess for first paint only — DateNavigator corrects
  // this client-side to the viewer's real local date (see its comments).
  const date = params.date ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: meals }, { data: totals }, { data: goals }] = await Promise.all([
    supabase
      .from("meal_logs")
      .select("id, meal_type, calories, protein_g, carbs_g, fat_g, logged_at, detected_items")
      .eq("user_id", user!.id)
      .gte("logged_at", `${date}T00:00:00`)
      .lte("logged_at", `${date}T23:59:59`)
      .order("logged_at", { ascending: false }),
    supabase.from("daily_totals").select("water_ml").eq("user_id", user!.id).eq("date", date).single(),
    supabase.from("goals").select("water_target_ml").eq("user_id", user!.id).single(),
  ]);

  const cards: MealCardData[] = (meals ?? []).map((m) => {
    const items = (m.detected_items ?? []) as Array<{ name: string }>;
    return {
      id: m.id,
      type: (m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)) as MealCardData["type"],
      name: items.length > 0 ? items.map((i) => i.name).join(", ") : "Meal",
      loggedAtIso: m.logged_at,
      calories: Math.round(Number(m.calories)),
      proteinG: Math.round(Number(m.protein_g)),
      carbsG: Math.round(Number(m.carbs_g)),
      fatG: Math.round(Number(m.fat_g)),
    };
  });

  const sections = SECTION_ORDER.map((type) => ({
    type,
    label: MEAL_TYPE_LABELS[type],
    meals: cards.filter((c) => c.type.toLowerCase() === type),
  })).filter((section) => section.meals.length > 0);

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">Meals</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/meals/new?mode=manual"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white"
          >
            <Plus size={18} />
          </Link>
          <ProfileMenuButton />
        </div>
      </div>

      <DateNavigator view="day" />

      {/* Water gets its own section, separate from the meal-type groups below */}
      <WaterSummaryCard
        initialMl={Math.round(Number(totals?.water_ml ?? 0))}
        targetMl={goals?.water_target_ml ?? 2500}
      />

      {sections.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meals logged this day"
          description="Tap the + button to log a meal — by photo, voice, or just typing what you ate."
        />
      ) : (
        sections.map((section) => (
          <div key={section.type} className="space-y-2.5">
            <h2 className="font-display text-sm font-medium text-black/50 dark:text-white/50">
              {section.label}
            </h2>
            {section.meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} href={`/meals/${meal.id}`} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
