import { Droplet, Beef, Wheat, Droplets, Leaf } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CalorieRing } from "@/components/dashboard/calorie-ring";
import { MacroCard } from "@/components/dashboard/macro-card";
import { MealCard, type MealCardData } from "@/components/shared/meal-card";
import { WorkoutCard, type WorkoutCardData } from "@/components/shared/workout-card";
import { ProfileMenuButton } from "@/components/navigation/profile-menu-button";
import { GreetingText } from "@/components/dashboard/greeting-text";
import { Logo } from "@/components/shared/logo";
import { DateNavigator } from "@/components/shared/date-navigator";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { MetricTrendCard } from "@/components/analytics/metric-trend-card";
import { ComparisonTrendCard } from "@/components/analytics/comparison-trend-card";
import { MacroSplitCard } from "@/components/analytics/macro-split-card";
import { StreakCard } from "@/components/dashboard/streak-card";
import { getDailyTotalsRange } from "@/lib/nutrition/get-range-totals";
import { getWorkoutCaloriesForDate, getWorkoutTotalsRange } from "@/lib/nutrition/get-workout-totals";
import { computeStreakDays, type StreakDay } from "@/lib/nutrition/streak";
import { type ViewMode, periodBounds, startOfWeek, endOfWeek } from "@/lib/nutrition/date";
import type { WorkoutType } from "@/lib/nutrition/workout-type";

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

  const [{ data: profile }, { data: goals }, rangeTotals, workoutRangeTotals] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user!.id).single(),
    supabase.from("goals").select("*").eq("user_id", user!.id).single(),
    getDailyTotalsRange(supabase, user!.id, rangeStart, rangeEnd),
    getWorkoutTotalsRange(supabase, user!.id, rangeStart, rangeEnd),
  ]);

  // Streak always looks at the 7 days ending on whatever date is being
  // viewed, independent of the Day/Week/Month selector above.
  // Streak is always the fixed Monday–Sunday week containing whatever date is
  // being viewed — not a rolling 7-day window — so it reads as a real weekly
  // calendar, matching how most people actually think about a "week."
  const streakStart = startOfWeek(anchor);
  const streakEnd = endOfWeek(anchor);
  const [streakTotals, streakWorkouts] = await Promise.all([
    getDailyTotalsRange(supabase, user!.id, streakStart, streakEnd),
    getWorkoutTotalsRange(supabase, user!.id, streakStart, streakEnd),
  ]);
  const burnedByStreakDate = new Map(streakWorkouts.map((w) => [w.date, w.caloriesBurned]));

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const g = goals ?? {
    calorie_target: 2000,
    protein_target_g: 120,
    carb_target_g: 220,
    fat_target_g: 65,
    fibre_target_g: 30,
    water_target_ml: 2500,
  };

  const streakDays = computeStreakDays(
    streakTotals.map((t) => ({
      date: t.date,
      calories: t.calories,
      caloriesBurned: burnedByStreakDate.get(t.date) ?? 0,
    })),
    g.calorie_target
  );

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
          streakDays={streakDays}
        />
      ) : (
        <TrendsView totals={rangeTotals} workoutTotals={workoutRangeTotals} goals={g} />
      )}
    </div>
  );
}

async function DayView({
  totals,
  goals,
  supabaseUserId,
  date,
  streakDays,
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
  streakDays: StreakDay[];
}) {
  const supabase = await createClient();
  const [{ data: meals }, { data: workouts }, burned] = await Promise.all([
    supabase
      .from("meal_logs")
      .select("id, meal_type, calories, protein_g, carbs_g, fat_g, logged_at, detected_items")
      .eq("user_id", supabaseUserId)
      .gte("logged_at", `${date}T00:00:00`)
      .lte("logged_at", `${date}T23:59:59`),
    supabase
      .from("workout_logs")
      .select("id, workout_type, start_time, duration_minutes, calories_burned, source")
      .eq("user_id", supabaseUserId)
      .eq("date", date),
    getWorkoutCaloriesForDate(supabase, supabaseUserId, date),
  ]);

  const mealCards: (MealCardData & { kind: "meal"; sortIso: string })[] = (meals ?? []).map((m) => {
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
      kind: "meal" as const,
      sortIso: m.logged_at,
    };
  });

  const workoutCards: (WorkoutCardData & { kind: "workout"; sortIso: string })[] = (workouts ?? []).map((w) => ({
    id: w.id,
    workoutType: w.workout_type as WorkoutType,
    startIso: `${date}T${w.start_time}`,
    durationMinutes: w.duration_minutes,
    caloriesBurned: Number(w.calories_burned),
    source: w.source as "manual" | "apple_health",
    kind: "workout" as const,
    sortIso: `${date}T${w.start_time}`,
  }));

  // Unified chronological timeline — meals and workouts interleaved by time.
  const timeline = [...mealCards, ...workoutCards].sort((a, b) => a.sortIso.localeCompare(b.sortIso));

  return (
    <div className="space-y-6">
      <section className="glass-card flex flex-col items-center px-4 py-6">
        <span className="mb-2 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          Energy Today
        </span>
        <CalorieRing consumed={Math.round(totals.calories)} target={goals.calorie_target} burned={Math.round(burned)} />
      </section>

      <StreakCard days={streakDays} />

      <section className="grid grid-cols-2 gap-3">
        <MacroCard icon={Beef} label="Protein" current={Math.round(totals.protein_g)} target={goals.protein_target_g} unit="g" />
        <MacroCard icon={Wheat} label="Carbs" current={Math.round(totals.carbs_g)} target={goals.carb_target_g} unit="g" colorClass="bg-sky-500" />
        <MacroCard icon={Droplet} label="Fat" current={Math.round(totals.fat_g)} target={goals.fat_target_g} unit="g" colorClass="bg-amber-500" />
        <MacroCard icon={Leaf} label="Fibre" current={Math.round(totals.fibre_g)} target={goals.fibre_target_g} unit="g" />
        <MacroCard icon={Droplets} label="Water" current={Math.round(totals.water_ml)} target={goals.water_target_ml} unit="ml" colorClass="bg-sky-500" />
      </section>

      <section>
        <h2 className="mb-3 font-display text-base font-medium text-ink dark:text-cream-100">
          Timeline
        </h2>
        {timeline.length === 0 ? (
          <p className="glass-card py-8 text-center text-sm text-black/50 dark:text-white/50">
            Nothing logged this day.
          </p>
        ) : (
          <div className="space-y-2.5">
            {timeline.map((entry) =>
              entry.kind === "meal" ? (
                <MealCard key={`meal-${entry.id}`} meal={entry} href={`/meals/${entry.id}`} />
              ) : (
                <WorkoutCard key={`workout-${entry.id}`} workout={entry} href={`/workouts/${entry.id}`} />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function TrendsView({
  totals,
  workoutTotals,
  goals,
}: {
  totals: Array<{ date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; fibre_g: number; water_ml: number }>;
  workoutTotals: Array<{ date: string; caloriesBurned: number; workoutCount: number; durationMinutes: number }>;
  goals: {
    calorie_target: number;
    protein_target_g: number;
    carb_target_g: number;
    fat_target_g: number;
    fibre_target_g: number;
    water_target_ml: number;
  };
}) {
  const burnedByDate = new Map(workoutTotals.map((w) => [w.date, w.caloriesBurned]));

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          Energy balance
        </p>
        <div className="space-y-3">
          <MetricTrendCard
            label="Net Calories"
            unit="kcal"
            color="#10B981"
            target={goals.calorie_target}
            data={totals.map((t) => ({ date: t.date, value: t.calories - (burnedByDate.get(t.date) ?? 0) }))}
          />
          <ComparisonTrendCard
            title="Consumed vs Burned"
            unit="kcal"
            series={[
              { label: "Consumed", color: "#10B981", data: totals.map((t) => ({ date: t.date, value: t.calories })) },
              { label: "Burned", color: "#3B82F6", data: workoutTotals.map((w) => ({ date: w.date, value: w.caloriesBurned })) },
            ]}
          />
          <MetricTrendCard
            label="Workout Duration"
            unit="min"
            color="#3B82F6"
            data={workoutTotals.map((w) => ({ date: w.date, value: w.durationMinutes }))}
          />
          <MetricTrendCard
            label="Workout Frequency"
            unit="workouts"
            color="#F59E0B"
            data={workoutTotals.map((w) => ({ date: w.date, value: w.workoutCount }))}
            format="oneDecimal"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          Nutrition
        </p>
        <div className="space-y-3">
          <MacroSplitCard
            data={totals.map((t) => ({ date: t.date, fatG: t.fat_g, carbsG: t.carbs_g, proteinG: t.protein_g }))}
          />
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
      </div>
    </div>
  );
}
