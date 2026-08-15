import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/navigation/app-header";
import { WeekNavigator } from "./week-navigator";
import { ReportView } from "./report-view";
import type { ScoreBreakdownItem } from "@/components/progress/score-breakdown";
import { getDailyTotalsRange } from "@/lib/nutrition/get-range-totals";
import { getWorkoutTotalsRange } from "@/lib/nutrition/get-workout-totals";
import { getDailyMetricSeries } from "@/lib/nutrition/get-health-metrics";
import { calcConsistencyDetail, average } from "@/lib/nutrition/consistency";
import { calcWeekConsistencyDetails } from "@/lib/nutrition/coach-insights";
import { computeStreakDays, currentStreakLength } from "@/lib/nutrition/streak";
import { computeAchievements } from "@/lib/nutrition/achievements";
import { startOfWeek, endOfWeek, formatPeriodLabel } from "@/lib/nutrition/date";

const STEPS_GOAL = 8000;

// Same per-metric palette NutritionConsistencyCard uses on Progress, so a
// given week's numbers read the same way in both places.
const METRIC_COLORS = {
  calories: "#10B981",
  protein: "#059669",
  carbs: "#3B82F6",
  fat: "#F59E0B",
  fibre: "#0EA5E9",
  water: "#38BDF8",
  steps: "#F59E0B",
} as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  // Rough server-side "today" guess, same pattern used as the analytics-window
  // anchor on Dashboard/Coach/Progress — fine here since it's just a default
  // when no ?week= is present, not something rendered as "the current time".
  const todayRough = new Date().toISOString().slice(0, 10);
  const anchor = params.week ?? todayRough;
  const weekStart = startOfWeek(anchor);
  const weekEnd = endOfWeek(anchor);
  const weekLabel = formatPeriodLabel("week", weekStart);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [
    { data: goalsRow },
    totals,
    workoutTotals,
    stepsSeries,
    { data: existingReport },
    { data: currentWeightLog },
    { data: earliestWeightLog },
  ] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", userId).single(),
    getDailyTotalsRange(supabase, userId, weekStart, weekEnd),
    getWorkoutTotalsRange(supabase, userId, weekStart, weekEnd),
    getDailyMetricSeries(supabase, userId, "step_count", weekStart, weekEnd),
    supabase
      .from("weekly_reports")
      .select("focus_areas, accomplishments, upcoming_focus, generated_at")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase.from("weight_logs").select("weight").eq("user_id", userId).order("measured_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("weight_logs").select("weight").eq("user_id", userId).order("measured_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  const goals = goalsRow ?? {
    calorie_target: 2000,
    protein_target_g: 120,
    carb_target_g: 220,
    fat_target_g: 65,
    fibre_target_g: 30,
    water_target_ml: 2500,
    goal_weight_kg: null as number | null,
  };

  // --- Same direction-aware source of truth Progress/Coach use — a week's
  // "focus areas" report can never disagree with what /progress shows for
  // the same week. ---
  const details = calcWeekConsistencyDetails(totals, goals);
  const stepsDetail = calcConsistencyDetail(stepsSeries.map((p) => p.value), STEPS_GOAL, "min");
  const maxSteps = Math.max(0, ...stepsSeries.map((p) => p.value));

  const focusAreas: ScoreBreakdownItem[] = [
    { label: "Calories", hits: details.calories.hits, total: details.calories.total, direction: "max" as const, color: METRIC_COLORS.calories },
    { label: "Protein", hits: details.protein.hits, total: details.protein.total, direction: "min" as const, color: METRIC_COLORS.protein },
    { label: "Carbs", hits: details.carbs.hits, total: details.carbs.total, direction: "max" as const, color: METRIC_COLORS.carbs },
    { label: "Fat", hits: details.fat.hits, total: details.fat.total, direction: "max" as const, color: METRIC_COLORS.fat },
    { label: "Fibre", hits: details.fibre.hits, total: details.fibre.total, direction: "min" as const, color: METRIC_COLORS.fibre },
    { label: "Water", hits: details.water.hits, total: details.water.total, direction: "min" as const, color: METRIC_COLORS.water },
    ...(maxSteps > 0
      ? [{ label: "Steps", hits: stepsDetail.hits, total: stepsDetail.total, direction: "min" as const, color: METRIC_COLORS.steps }]
      : []),
  ].filter((item) => item.total > 0);

  // --- Accomplishments: same computeAchievements() Progress uses, scoped to
  // this week's workouts/steps (weight-goal progress is inherently all-time,
  // same as how Progress's Achievement strip treats it). ---
  const burnedByDate = new Map(workoutTotals.map((w) => [w.date, w.caloriesBurned]));
  const streakDays = computeStreakDays(
    totals.map((t) => ({ date: t.date, calories: t.calories, caloriesBurned: burnedByDate.get(t.date) ?? 0 })),
    goals.calorie_target
  );
  // `todayRough` (not `weekEnd`) is the correct cutoff here: for a past week
  // every day is already before it, so nothing changes; for the *current*
  // week it correctly excludes today-and-later zero-filled days from being
  // misread as misses — same "today is never counted" rule streak.ts documents.
  const streak = currentStreakLength(streakDays, todayRough);
  const totalWorkouts = workoutTotals.reduce((sum, w) => sum + w.workoutCount, 0);

  const weightGoalProgressPct =
    currentWeightLog && earliestWeightLog && goals.goal_weight_kg && earliestWeightLog.weight !== goals.goal_weight_kg
      ? Math.min(
          Math.max(((earliestWeightLog.weight - currentWeightLog.weight) / (earliestWeightLog.weight - goals.goal_weight_kg)) * 100, 0),
          100
        )
      : null;

  const achievements = computeAchievements({
    maxSteps,
    currentStreak: streak,
    proteinConsistencyPct: details.protein.pct,
    weightGoalProgressPct,
    maxWorkoutsInAWeek: totalWorkouts,
  });
  const accomplishments = achievements.filter((a) => a.achieved).map((a) => a.label);

  // --- Upcoming focus: whichever tracked metric had the lowest hit rate. ---
  const weakest = [...focusAreas].sort((a, b) => a.hits / a.total - b.hits / b.total)[0];
  const upcomingFocus = weakest
    ? weakest.hits / weakest.total >= 1
      ? "Every tracked target was on point this week — keep the same routine going into next week."
      : `${weakest.label} was your toughest target this week (${weakest.hits}/${weakest.total} days) — ${
          weakest.direction === "min" ? "aim to reach it more consistently" : "aim to stay under it more consistently"
        } next week.`
    : "Log a few meals, water, or workouts this week to get a personalized focus area for next week.";

  return (
    <div className="animate-fade-up space-y-6 pb-8">
      <AppHeader />

      <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100 print:hidden">Weekly Reports</h1>

      <WeekNavigator anchor={weekStart} />

      <ReportView
        weekStart={weekStart}
        weekEnd={weekEnd}
        weekLabel={weekLabel}
        focusAreas={focusAreas}
        accomplishments={accomplishments}
        upcomingFocus={upcomingFocus}
        stats={{ avgCalories: average(totals.map((t) => t.calories)), totalWorkouts, streak }}
        initialGeneratedAt={existingReport?.generated_at ?? null}
      />
    </div>
  );
}
