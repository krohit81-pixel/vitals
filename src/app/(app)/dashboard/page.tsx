import { Droplet, Beef, Wheat, Droplets, Leaf } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CalorieRing } from "@/components/dashboard/calorie-ring";
import { MacroCard } from "@/components/dashboard/macro-card";
import { MealCard, type MealCardData } from "@/components/shared/meal-card";
import { ProfileMenuButton } from "@/components/navigation/profile-menu-button";
import { GreetingText } from "@/components/dashboard/greeting-text";
import { Logo } from "@/components/shared/logo";
import { DateNavigator } from "@/components/shared/date-navigator";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { MetricTrendCard } from "@/components/analytics/metric-trend-card";
import { getDailyTotalsRange } from "@/lib/nutrition/get-range-totals";
import { type ViewMode, periodBounds } from "@/lib/nutrition/date";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;
  const view = (params.view === "week" || params.view === "month" ? params.view : "day") as ViewMode;
  // Falls back to a rough server-side guess only for the very first paint —
  // DateNavigator immediately corrects this client-side to the viewer's real
  // local date (see its comments for why this can't be done server-side).
  const anchor = params.date ?? new Date().toISOString().slice(0, 10);
  const [rangeStart, rangeEnd] = periodBounds(view, anchor);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: goals }, rangeTotals] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user!.id).single(),
    supabase.from("goals").select("*").eq("user_id", user!.id).single(),
    getDailyTotalsRange(supabase, user!.id, rangeStart, rangeEnd),
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

  return (
    <div className="animate-fade-up space-y-5">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">
              <GreetingText />
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">
              {firstName}
            </h1>
          </div>
        </div>
        <ProfileMenuButton />
      </header>

      <PeriodSelector view={view} />
      <DateNavigator view={view} />

      {view === "day" ? (
        <DayView
          totals={rangeTotals[0] ?? { date: anchor, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, water_ml: 0 }}
          goals={g}
          supabaseUserId={user!.id}
          date={anchor}
        />
      ) : (
        <TrendsView totals={rangeTotals} goals={g} />
      )}
    </div>
  );
}

async function DayView({
  totals,
  goals,
  supabaseUserId,
  date,
}: {
  totals: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number; water_ml: number };
  goals: {
    calorie_target: number;
    protein_target_g: number;
    carb_target_g: number;
    fat_target_g: number;
    fibre_target_g: number;
    water_target_ml: number;
  };
  supabaseUserId: string;
  date: string;
}) {
  const supabase = await createClient();
  const { data: meals } = await supabase
    .from("meal_logs")
    .select("id, meal_type, calories, protein_g, carbs_g, fat_g, logged_at, detected_items")
    .eq("user_id", supabaseUserId)
    .gte("logged_at", `${date}T00:00:00`)
    .lte("logged_at", `${date}T23:59:59`)
    .order("logged_at", { ascending: false });

  const mealCards: MealCardData[] = (meals ?? []).map((m) => {
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

  return (
    <div className="space-y-6">
      <section className="glass-card flex flex-col items-center">
        <span className="mb-1 text-sm font-medium text-black/60 dark:text-white/60">
          Summary
        </span>
        <CalorieRing consumed={Math.round(totals.calories)} target={goals.calorie_target} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MacroCard icon={Beef} label="Protein" current={Math.round(totals.protein_g)} target={goals.protein_target_g} unit="g" />
        <MacroCard icon={Wheat} label="Carbs" current={Math.round(totals.carbs_g)} target={goals.carb_target_g} unit="g" colorClass="bg-sky-500" />
        <MacroCard icon={Droplet} label="Fat" current={Math.round(totals.fat_g)} target={goals.fat_target_g} unit="g" colorClass="bg-amber-500" />
        <MacroCard icon={Leaf} label="Fibre" current={Math.round(totals.fibre_g)} target={goals.fibre_target_g} unit="g" />
        <MacroCard icon={Droplets} label="Water" current={Math.round(totals.water_ml)} target={goals.water_target_ml} unit="ml" colorClass="bg-sky-500" />
      </section>

      <section>
        <h2 className="mb-3 font-display text-base font-medium text-ink dark:text-cream-100">
          Meals
        </h2>
        {mealCards.length === 0 ? (
          <p className="glass-card py-8 text-center text-sm text-black/50 dark:text-white/50">
            Nothing logged this day.
          </p>
        ) : (
          <div className="space-y-2.5">
            {mealCards.map((meal) => (
              <MealCard key={meal.id} meal={meal} href={`/meals/${meal.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TrendsView({
  totals,
  goals,
}: {
  totals: Array<{ date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number; water_ml: number }>;
  goals: {
    calorie_target: number;
    protein_target_g: number;
    carb_target_g: number;
    fat_target_g: number;
    fibre_target_g: number;
    water_target_ml: number;
  };
}) {
  return (
    <div className="space-y-3">
      <MetricTrendCard
        label="Calories"
        unit="kcal"
        color="#10B981"
        target={goals.calorie_target}
        data={totals.map((t) => ({ date: t.date, value: t.calories }))}
      />
      <MetricTrendCard
        label="Protein"
        unit="g"
        color="#10B981"
        target={goals.protein_target_g}
        data={totals.map((t) => ({ date: t.date, value: t.protein_g }))}
      />
      <MetricTrendCard
        label="Carbs"
        unit="g"
        color="#3B82F6"
        target={goals.carb_target_g}
        data={totals.map((t) => ({ date: t.date, value: t.carbs_g }))}
      />
      <MetricTrendCard
        label="Fat"
        unit="g"
        color="#F59E0B"
        target={goals.fat_target_g}
        data={totals.map((t) => ({ date: t.date, value: t.fat_g }))}
      />
      <MetricTrendCard
        label="Fibre"
        unit="g"
        color="#10B981"
        target={goals.fibre_target_g}
        data={totals.map((t) => ({ date: t.date, value: t.fibre_g }))}
      />
      <MetricTrendCard
        label="Water"
        unit="ml"
        color="#3B82F6"
        target={goals.water_target_ml}
        data={totals.map((t) => ({ date: t.date, value: t.water_ml }))}
      />
    </div>
  );
}
