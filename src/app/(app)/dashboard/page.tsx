import { Droplet, Beef, Wheat, Droplets, Leaf } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CalorieRing } from "@/components/dashboard/calorie-ring";
import { MacroCard } from "@/components/dashboard/macro-card";
import { MealCard, type MealCardData } from "@/components/shared/meal-card";

function todayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: goals }, { data: totals }, { data: meals }] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user!.id).single(),
    supabase.from("goals").select("*").eq("user_id", user!.id).single(),
    supabase.from("daily_totals").select("*").eq("user_id", user!.id).eq("date", todayDateString()).single(),
    supabase
      .from("meal_logs")
      .select("id, meal_type, calories, protein_g, carbs_g, fat_g, logged_at, detected_items")
      .eq("user_id", user!.id)
      .gte("logged_at", startOfTodayISO())
      .order("logged_at", { ascending: false }),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const g = goals ?? {
    calorie_target: 2000,
    protein_target_g: 120,
    carb_target_g: 220,
    fat_target_g: 65,
    fibre_target_g: 30,
    water_target_ml: 2500,
  };
  const t = totals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, water_ml: 0 };

  const mealCards: MealCardData[] = (meals ?? []).map((m) => {
    const items = (m.detected_items ?? []) as Array<{ name: string }>;
    return {
      id: m.id,
      type: (m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)) as MealCardData["type"],
      name: items.length > 0 ? items.map((i) => i.name).join(", ") : "Meal",
      time: new Date(m.logged_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      calories: Math.round(Number(m.calories)),
      proteinG: Math.round(Number(m.protein_g)),
      carbsG: Math.round(Number(m.carbs_g)),
      fatG: Math.round(Number(m.fat_g)),
    };
  });

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <p className="text-sm text-black/50 dark:text-white/50">Good morning,</p>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">
          {firstName}
        </h1>
      </header>

      <section className="glass-card flex flex-col items-center">
        <span className="mb-1 text-sm font-medium text-black/60 dark:text-white/60">
          Today&apos;s Summary
        </span>
        <CalorieRing consumed={Math.round(Number(t.calories))} target={g.calorie_target} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MacroCard icon={Beef} label="Protein" current={Math.round(Number(t.protein_g))} target={g.protein_target_g} unit="g" />
        <MacroCard icon={Wheat} label="Carbs" current={Math.round(Number(t.carbs_g))} target={g.carb_target_g} unit="g" colorClass="bg-sky-500" />
        <MacroCard icon={Droplet} label="Fat" current={Math.round(Number(t.fat_g))} target={g.fat_target_g} unit="g" colorClass="bg-amber-500" />
        <MacroCard icon={Leaf} label="Fibre" current={Math.round(Number(t.fibre_g))} target={g.fibre_target_g} unit="g" />
        <MacroCard icon={Droplets} label="Water" current={Math.round(Number(t.water_ml))} target={g.water_target_ml} unit="ml" colorClass="bg-sky-500" />
      </section>

      <section>
        <h2 className="mb-3 font-display text-base font-medium text-ink dark:text-cream-100">
          Today&apos;s Meals
        </h2>
        {mealCards.length === 0 ? (
          <p className="glass-card py-8 text-center text-sm text-black/50 dark:text-white/50">
            Nothing logged yet — tap the + button to add your first meal.
          </p>
        ) : (
          <div className="space-y-2.5">
            {mealCards.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
