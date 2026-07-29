import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/navigation/app-header";
import { HealthScoreRing } from "@/components/progress/health-score-ring";
import { ScoreBreakdown, type ScoreBreakdownItem } from "@/components/progress/score-breakdown";
import { RangeSelector } from "@/components/progress/range-selector";
import { WeightCard } from "@/components/progress/weight-card";
import { HeartRateCard } from "@/components/progress/heart-rate-card";
import { ActivityCard } from "@/components/progress/activity-card";
import { NutritionConsistencyCard } from "@/components/progress/nutrition-consistency-card";
import { AchievementStrip } from "@/components/progress/achievement-strip";
import { HealthInsightsCard } from "./health-insights";
import { getDailyTotalsRange } from "@/lib/nutrition/get-range-totals";
import { getWorkoutTotalsRange } from "@/lib/nutrition/get-workout-totals";
import { getWeightSeries } from "@/lib/nutrition/get-weight-series";
import { getDailyMetricSeries, summarizeSeries } from "@/lib/nutrition/get-health-metrics";
import { calcConsistencyDetail } from "@/lib/nutrition/consistency";
import { calcWeekConsistencyDetails, calcRhythmScore, trendDirection } from "@/lib/nutrition/coach-insights";
import { computeStreakDays, currentStreakLength } from "@/lib/nutrition/streak";
import { computeAchievements } from "@/lib/nutrition/achievements";
import { addDays, rangeToDays, parseDateString, type RangeOption } from "@/lib/nutrition/date";

const STEPS_GOAL = 8000;

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = (["7d", "30d", "90d", "1y"].includes(params.range ?? "") ? params.range : "7d") as RangeOption;
  const days = rangeToDays(range);

  // Rough server-side guess, consistent with the same pattern used on
  // Dashboard/Coach — fine here since it's just the anchor for a rolling
  // analytics window, not something the viewer navigates via URL.
  const today = new Date().toISOString().slice(0, 10);
  const periodStart = addDays(today, -(days - 1));
  const prevPeriodEnd = addDays(periodStart, -1);
  const prevPeriodStart = addDays(prevPeriodEnd, -(days - 1));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [
    { data: goalsRow },
    totals,
    prevTotals,
    workoutTotals,
    { data: weightLogs },
    weightSeries,
    stepsSeries,
    rhrSeries,
    { data: profileRow },
  ] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", userId).single(),
    getDailyTotalsRange(supabase, userId, periodStart, today),
    getDailyTotalsRange(supabase, userId, prevPeriodStart, prevPeriodEnd),
    getWorkoutTotalsRange(supabase, userId, periodStart, today),
    supabase
      .from("weight_logs")
      .select("weight, unit, measured_at")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(1),
    getWeightSeries(supabase, userId, periodStart, today),
    getDailyMetricSeries(supabase, userId, "step_count", periodStart, today),
    getDailyMetricSeries(supabase, userId, "resting_heart_rate", periodStart, today),
    supabase
      .from("users")
      .select("age, gender, height_cm, weight_kg, activity_level, diet_type, allergies")
      .eq("id", userId)
      .single(),
  ]);

  const { data: latestInsights } = await supabase
    .from("health_insights")
    .select("insights, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: earliestWeightLog } = await supabase
    .from("weight_logs")
    .select("weight")
    .eq("user_id", userId)
    .order("measured_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const goals = goalsRow ?? {
    calorie_target: 2000,
    protein_target_g: 120,
    carb_target_g: 220,
    fat_target_g: 65,
    fibre_target_g: 30,
    water_target_ml: 2500,
    goal_weight_kg: null as number | null,
  };

  // --- Nutrition: hits/total per metric, direction-aware (calories/carbs/fat
  // are budgets — "on track" means staying under; protein/fibre/water are
  // floors — "on track" means reaching them). This is the one source of
  // truth for both the Health Score breakdown and the Nutrition card below,
  // so the two can never disagree about what "on track" meant that day. ---
  const details = calcWeekConsistencyDetails(totals, goals);
  const prevDetails = calcWeekConsistencyDetails(prevTotals, goals);

  // --- Activity ---
  const stepsStats = summarizeSeries(stepsSeries);
  const totalWorkouts = workoutTotals.reduce((sum, w) => sum + w.workoutCount, 0);
  const stepsDetail = calcConsistencyDetail(
    stepsSeries.map((p) => p.value),
    STEPS_GOAL,
    "min"
  );

  // --- Heart ---
  const rhrStats = summarizeSeries(rhrSeries);
  const rhrDirection = trendDirection(rhrSeries.map((p) => p.value));

  // --- Weight ---
  const currentWeight = weightLogs?.[0] ?? null;

  // --- BMI: prefer the latest logged weight (converted to kg if needed),
  // fall back to the weight on file in Personal details. Height only comes
  // from the profile — there's no other source for it in the app.
  const weightKgForBmi = currentWeight
    ? currentWeight.unit === "lb"
      ? currentWeight.weight * 0.453592
      : currentWeight.weight
    : (profileRow?.weight_kg ?? null);
  const heightM = profileRow?.height_cm ? profileRow.height_cm / 100 : null;
  const bmi = heightM && weightKgForBmi ? weightKgForBmi / (heightM * heightM) : null;

  // --- Streak (for health score + achievements) ---
  const burnedByDate = new Map(workoutTotals.map((w) => [w.date, w.caloriesBurned]));
  const streakDays = computeStreakDays(
    totals.map((t) => ({ date: t.date, calories: t.calories, caloriesBurned: burnedByDate.get(t.date) ?? 0 })),
    goals.calorie_target
  );
  const streak = currentStreakLength(streakDays, today);

  // --- Health Score: composite of whatever signals are actually available.
  // `scoreItems` drives BOTH the number and the on-screen breakdown, so the
  // ring can never show a score the breakdown doesn't add up to. ---
  const scoreItems: ScoreBreakdownItem[] = [
    { label: "Calories", hits: details.calories.hits, total: details.calories.total, direction: "max", color: "#10B981" },
    { label: "Protein", hits: details.protein.hits, total: details.protein.total, direction: "min", color: "#3B82F6" },
    { label: "Fibre", hits: details.fibre.hits, total: details.fibre.total, direction: "min", color: "#059669" },
  ];
  if (stepsStats.average > 0) {
    scoreItems.push({ label: "Steps goal", hits: stepsDetail.hits, total: stepsDetail.total, direction: "min", color: "#F59E0B" });
  }
  const healthScore = calcRhythmScore(scoreItems.map((i) => (i.total > 0 ? (i.hits / i.total) * 100 : 0)));

  const prevScoreInputs = [prevDetails.calories.pct, prevDetails.protein.pct, prevDetails.fibre.pct];
  const prevHealthScore = calcRhythmScore(prevScoreInputs);
  // "vs 0" isn't a real comparison — only show a delta if the previous period
  // actually has logged data, otherwise it just misleadingly equals the
  // current score (exactly the bug that was reported).
  const hasPreviousPeriodData = prevTotals.some((t) => t.calories > 0);
  const scoreDelta = hasPreviousPeriodData ? healthScore.score - prevHealthScore.score : null;
  const previousPeriodLabel = `${parseDateString(prevPeriodStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${parseDateString(prevPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  const currentPeriodLabel = `${parseDateString(periodStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${parseDateString(today).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  const weightGoalProgressPct =
    currentWeight && earliestWeightLog && goals.goal_weight_kg && earliestWeightLog.weight !== goals.goal_weight_kg
      ? Math.min(
          Math.max(
            ((earliestWeightLog.weight - currentWeight.weight) / (earliestWeightLog.weight - goals.goal_weight_kg)) * 100,
            0
          ),
          100
        )
      : null;

  const achievements = computeAchievements({
    maxSteps: Math.max(0, ...stepsSeries.map((p) => p.value)),
    currentStreak: streak,
    proteinConsistencyPct: details.protein.pct,
    weightGoalProgressPct,
    maxWorkoutsInAWeek: totalWorkouts,
  });

  return (
    <div className="animate-fade-up space-y-6 pb-8">
      <AppHeader />

      <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">Progress</h1>

      <RangeSelector range={range} periodLabel={currentPeriodLabel} />

      <div className="glass-card p-5">
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <HealthScoreRing score={healthScore.score} deltaVsPrevious={scoreDelta} previousPeriodLabel={previousPeriodLabel} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
              Health score
            </span>
            <p className="mt-1 text-sm font-medium text-ink dark:text-cream-100">{healthScore.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-black/45 dark:text-white/45">
              Average of {scoreItems.length} target{scoreItems.length === 1 ? "" : "s"} you hit this period — see the
              breakdown below.
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-black/[0.05] pt-4 dark:border-white/[0.06]">
          <ScoreBreakdown items={scoreItems} />
        </div>
      </div>

      <HealthInsightsCard
        context={{
          nutritionConsistencyPct: details.calories.pct,
          activityTrend: { direction: totalWorkouts >= 3 ? "up" : "flat", workoutsThisPeriod: totalWorkouts },
          ...(rhrStats.latest !== null && {
            restingHeartRateTrend: { direction: rhrDirection, current: Math.round(rhrStats.latest) },
          }),
          profile: profileRow
            ? {
                age: profileRow.age ?? undefined,
                gender: profileRow.gender ?? undefined,
                heightCm: profileRow.height_cm ?? undefined,
                weightKg: profileRow.weight_kg ?? undefined,
                activityLevel: profileRow.activity_level ?? undefined,
                dietType: profileRow.diet_type ?? undefined,
                allergies: profileRow.allergies ?? undefined,
              }
            : undefined,
        }}
        initial={
          latestInsights
            ? { insights: (latestInsights.insights ?? []) as string[], createdAt: latestInsights.created_at }
            : null
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <HeartRateCard series={rhrSeries} />
        <WeightCard
          series={weightSeries}
          currentWeight={currentWeight ? { weight: currentWeight.weight, unit: currentWeight.unit as "kg" | "lb" } : null}
          goalWeightKg={goals.goal_weight_kg}
          goalProgressPct={weightGoalProgressPct}
          bmi={bmi}
        />
      </div>

      <ActivityCard series={stepsSeries} totalWorkouts={totalWorkouts} />

      <NutritionConsistencyCard details={details} />

      <AchievementStrip achievements={achievements} />
    </div>
  );
}
