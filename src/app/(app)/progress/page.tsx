import { Suspense } from "react";
import { Scale, HeartPulse, Footprints, Apple, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileMenuButton } from "@/components/navigation/profile-menu-button";
import { GreetingText } from "@/components/dashboard/greeting-text";
import { HealthScoreRing } from "@/components/progress/health-score-ring";
import { RangeSelector } from "@/components/progress/range-selector";
import { OverviewCard } from "@/components/progress/overview-card";
import { HealthInsightsCard } from "./health-insights";
import { HealthInsightsSkeleton } from "./health-insights-skeleton";
import { getDailyTotalsRange } from "@/lib/nutrition/get-range-totals";
import { getWorkoutTotalsRange } from "@/lib/nutrition/get-workout-totals";
import { getDailyMetricSeries, summarizeSeries } from "@/lib/nutrition/get-health-metrics";
import { calcWeekConsistencies, calcRhythmScore, trendDirection } from "@/lib/nutrition/coach-insights";
import { computeStreakDays, currentStreakLength } from "@/lib/nutrition/streak";
import { computeAchievements } from "@/lib/nutrition/achievements";
import { addDays, rangeToDays, type RangeOption } from "@/lib/nutrition/date";

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
    stepsSeries,
    heartRateSeries,
    rhrSeries,
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
    getDailyMetricSeries(supabase, userId, "step_count", periodStart, today),
    getDailyMetricSeries(supabase, userId, "heart_rate", periodStart, today),
    getDailyMetricSeries(supabase, userId, "resting_heart_rate", periodStart, today),
  ]);

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

  // --- Nutrition ---
  const consistencies = calcWeekConsistencies(totals, goals);
  const prevConsistencies = calcWeekConsistencies(prevTotals, goals);

  // --- Activity ---
  const stepsStats = summarizeSeries(stepsSeries);
  const totalWorkouts = workoutTotals.reduce((sum, w) => sum + w.workoutCount, 0);

  // --- Heart ---
  const rhrStats = summarizeSeries(rhrSeries);
  const rhrDirection = trendDirection(rhrSeries.map((p) => p.value));

  // --- Weight ---
  const currentWeight = weightLogs?.[0];

  // --- Streak (for health score + achievements) ---
  const burnedByDate = new Map(workoutTotals.map((w) => [w.date, w.caloriesBurned]));
  const streakDays = computeStreakDays(
    totals.map((t) => ({ date: t.date, calories: t.calories, caloriesBurned: burnedByDate.get(t.date) ?? 0 })),
    goals.calorie_target
  );
  const streak = currentStreakLength(streakDays, today);

  // --- Health Score: composite of whatever signals are actually available ---
  const scoreInputs = [consistencies.calories, consistencies.protein, consistencies.fibre];
  if (stepsStats.average > 0) scoreInputs.push(Math.min((stepsStats.average / 8000) * 100, 100));
  const healthScore = calcRhythmScore(scoreInputs);

  const prevScoreInputs = [prevConsistencies.calories, prevConsistencies.protein, prevConsistencies.fibre];
  const prevHealthScore = calcRhythmScore(prevScoreInputs);
  const scoreDelta = healthScore.score - prevHealthScore.score;

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
    proteinConsistencyPct: consistencies.protein,
    weightGoalProgressPct,
    maxWorkoutsInAWeek: totalWorkouts,
  });

  return (
    <div className="animate-fade-up space-y-6 pb-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-black/50 dark:text-white/50">
            <GreetingText />
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">Progress</h1>
        </div>
        <ProfileMenuButton />
      </header>

      <div className="glass-card flex flex-col items-center py-6">
        <span className="mb-2 text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          Health Score
        </span>
        <HealthScoreRing score={healthScore.score} deltaVsPrevious={scoreDelta} />
      </div>

      <RangeSelector range={range} />

      <Suspense fallback={<HealthInsightsSkeleton />}>
        <HealthInsightsCard
          context={{
            nutritionConsistencyPct: consistencies.calories,
            activityTrend: { direction: totalWorkouts >= 3 ? "up" : "flat", workoutsThisPeriod: totalWorkouts },
            ...(rhrStats.latest !== null && {
              restingHeartRateTrend: { direction: rhrDirection, current: Math.round(rhrStats.latest) },
            }),
          }}
        />
      </Suspense>

      <div className="grid grid-cols-2 gap-3">
        <OverviewCard
          title="Weight"
          icon={<Scale size={14} style={{ color: "#3B82F6" }} />}
          value={currentWeight ? currentWeight.weight.toString() : "—"}
          unit={currentWeight?.unit}
          comparisonLabel={null}
          comparisonDirection={null}
          sparkline={[]}
          color="#3B82F6"
          href="/progress/weight"
        />
        <OverviewCard
          title="Heart"
          icon={<HeartPulse size={14} style={{ color: "#EF4444" }} />}
          value={rhrStats.latest !== null ? Math.round(rhrStats.latest).toString() : "—"}
          unit="bpm"
          comparisonLabel={rhrStats.latest !== null ? `${rhrDirection === "flat" ? "Stable" : rhrDirection}` : null}
          comparisonDirection={rhrDirection === "up" ? "down" : rhrDirection === "down" ? "up" : "flat"}
          sparkline={heartRateSeries.map((p) => p.value)}
          color="#EF4444"
          href="/progress/metric/heart_rate"
        />
        <OverviewCard
          title="Activity"
          icon={<Footprints size={14} style={{ color: "#F59E0B" }} />}
          value={stepsStats.average > 0 ? Math.round(stepsStats.average).toLocaleString() : "—"}
          unit="steps/day"
          comparisonLabel={`${totalWorkouts} workout${totalWorkouts === 1 ? "" : "s"}`}
          comparisonDirection="flat"
          sparkline={stepsSeries.map((p) => p.value)}
          color="#F59E0B"
          href="/progress/metric/step_count"
        />
        <OverviewCard
          title="Nutrition"
          icon={<Apple size={14} style={{ color: "#10B981" }} />}
          value={`${consistencies.protein}%`}
          unit="protein"
          comparisonLabel={`${consistencies.calories}% calories on target`}
          comparisonDirection="flat"
          sparkline={totals.map((t) => t.calories)}
          color="#10B981"
          href="/progress/nutrition"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Trophy size={15} className="text-amber-500" />
          <h2 className="font-display text-base font-medium text-ink dark:text-cream-100">Achievements</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {achievements.map((a) => (
            <span
              key={a.label}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                a.achieved
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                  : "bg-black/[0.04] text-black/35 dark:bg-white/[0.06] dark:text-white/35"
              }`}
            >
              {a.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
