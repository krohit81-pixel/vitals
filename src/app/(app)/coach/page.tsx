import { Suspense } from "react";
import { Beef, Leaf, Flame, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileMenuButton } from "@/components/navigation/profile-menu-button";
import { StreakCard } from "@/components/dashboard/streak-card";
import { InsightCard } from "@/components/coach/insight-card";
import { RhythmGauge } from "@/components/coach/rhythm-gauge";
import { AiFeedback } from "./ai-feedback";
import { AiFeedbackSkeleton } from "./ai-feedback-skeleton";
import { getDailyTotalsRange } from "@/lib/nutrition/get-range-totals";
import { getWorkoutTotalsRange } from "@/lib/nutrition/get-workout-totals";
import { computeStreakDays } from "@/lib/nutrition/streak";
import { startOfWeek, endOfWeek } from "@/lib/nutrition/date";
import { calcWeekConsistencies, calcRhythmScore, trendDirection } from "@/lib/nutrition/coach-insights";
import { average } from "@/lib/nutrition/consistency";

export default async function CoachPage() {
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: goalsRow }, totals, workoutTotals] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user!.id).single(),
    getDailyTotalsRange(supabase, user!.id, weekStart, weekEnd),
    getWorkoutTotalsRange(supabase, user!.id, weekStart, weekEnd),
  ]);

  const goals = goalsRow ?? {
    calorie_target: 2000,
    protein_target_g: 120,
    carb_target_g: 220,
    fat_target_g: 65,
    fibre_target_g: 30,
    water_target_ml: 2500,
  };

  const consistencies = calcWeekConsistencies(totals, goals);
  const rhythm = calcRhythmScore([consistencies.calories, consistencies.protein, consistencies.fibre, consistencies.water]);

  const burnedByDate = new Map(workoutTotals.map((w) => [w.date, w.caloriesBurned]));
  const netCalories = totals.map((t) => t.calories - (burnedByDate.get(t.date) ?? 0));
  const avgNet = average(netCalories);

  const streakDays = computeStreakDays(
    totals.map((t) => ({ date: t.date, calories: t.calories, caloriesBurned: burnedByDate.get(t.date) ?? 0 })),
    goals.calorie_target
  );

  const totalWorkouts = workoutTotals.reduce((sum, w) => sum + w.workoutCount, 0);

  // Today's status drives the hero card's accent color — same green/amber/red
  // language as the calorie ring, so the app speaks one visual dialect.
  const todayTotals = totals.find((t) => t.date === today);
  const todayBurned = burnedByDate.get(today) ?? 0;
  const todayRemaining = goals.calorie_target + todayBurned - (todayTotals?.calories ?? 0);
  const statusColor = todayRemaining < 0 ? "#EF4444" : todayRemaining <= 200 ? "#F59E0B" : "#10B981";

  const fibreTrend = trendDirection(totals.map((t) => t.fibre_g));

  return (
    <div className="animate-fade-up space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">AI Coach</h1>
        <ProfileMenuButton />
      </div>

      <Suspense fallback={<AiFeedbackSkeleton />}>
        <AiFeedback
          goals={{
            calories: goals.calorie_target,
            proteinG: goals.protein_target_g,
            carbsG: goals.carb_target_g,
            fatG: goals.fat_target_g,
            fibreG: goals.fibre_target_g,
          }}
          actuals={{
            calories: Math.round(average(totals.map((t) => t.calories))),
            proteinG: Math.round(average(totals.map((t) => t.protein_g))),
            carbsG: Math.round(average(totals.map((t) => t.carbs_g))),
            fatG: Math.round(average(totals.map((t) => t.fat_g))),
            fibreG: Math.round(average(totals.map((t) => t.fibre_g))),
          }}
          proteinConsistencyPct={consistencies.protein}
          statusColor={statusColor}
        />
      </Suspense>

      <div className="glass-card">
        <RhythmGauge rhythm={rhythm} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-base font-medium text-ink dark:text-cream-100">
          This week at a glance
        </h2>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          <InsightCard
            icon={<Beef size={14} style={{ color: "#10B981" }} />}
            label="Protein"
            headline={`${consistencies.protein}% consistent`}
            sparkline={totals.map((t) => t.protein_g)}
            color="#10B981"
          />
          <InsightCard
            icon={<Leaf size={14} style={{ color: "#059669" }} />}
            label="Fibre"
            headline={fibreTrend === "up" ? "Trending up" : fibreTrend === "down" ? "Trending down" : "Holding steady"}
            sparkline={totals.map((t) => t.fibre_g)}
            color="#059669"
            trend={fibreTrend}
          />
          <InsightCard
            icon={<Flame size={14} style={{ color: statusColor }} />}
            label="Net Calories"
            headline={`${Math.round(avgNet).toLocaleString()} avg/day`}
            sparkline={netCalories}
            color={statusColor}
          />
          <InsightCard
            icon={<Dumbbell size={14} style={{ color: "#3B82F6" }} />}
            label="Activity"
            headline={`${totalWorkouts} workout${totalWorkouts === 1 ? "" : "s"} this week`}
            sparkline={workoutTotals.map((w) => w.caloriesBurned)}
            color="#3B82F6"
          />
        </div>
      </div>

      <StreakCard days={streakDays} />
    </div>
  );
}
