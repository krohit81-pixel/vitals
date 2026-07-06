import Link from "next/link";
import { Inbox, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { MealCard, type MealCardData } from "@/components/shared/meal-card";
import { WorkoutCard, type WorkoutCardData } from "@/components/shared/workout-card";
import { WaterSummaryCard } from "@/components/meals/water-summary-card";
import { ProfileMenuButton } from "@/components/navigation/profile-menu-button";
import { DateNavigator } from "@/components/shared/date-navigator";
import type { WorkoutType } from "@/lib/nutrition/workout-type";

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

  const [{ data: meals }, { data: workouts }, { data: totals }, { data: goals }] = await Promise.all([
    supabase
      .from("meal_logs")
      .select("id, meal_type, calories, protein_g, carbs_g, fat_g, logged_at, detected_items")
      .eq("user_id", user!.id)
      .gte("logged_at", `${date}T00:00:00`)
      .lte("logged_at", `${date}T23:59:59`),
    supabase
      .from("workout_logs")
      .select("id, workout_type, start_time, duration_minutes, calories_burned, source")
      .eq("user_id", user!.id)
      .eq("date", date),
    supabase.from("daily_totals").select("water_ml").eq("user_id", user!.id).eq("date", date).single(),
    supabase.from("goals").select("water_target_ml").eq("user_id", user!.id).single(),
  ]);

  const mealEntries = (meals ?? []).map((m) => {
    const items = (m.detected_items ?? []) as Array<{ name: string }>;
    return {
      kind: "meal" as const,
      sortIso: m.logged_at,
      data: {
        id: m.id,
        type: (m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)) as MealCardData["type"],
        name: items.length > 0 ? items.map((i) => i.name).join(", ") : "Meal",
        loggedAtIso: m.logged_at,
        calories: Math.round(Number(m.calories)),
        proteinG: Math.round(Number(m.protein_g)),
        carbsG: Math.round(Number(m.carbs_g)),
        fatG: Math.round(Number(m.fat_g)),
      } satisfies MealCardData,
    };
  });

  const workoutEntries = (workouts ?? []).map((w) => ({
    kind: "workout" as const,
    sortIso: `${date}T${w.start_time}`,
    data: {
      id: w.id,
      workoutType: w.workout_type as WorkoutType,
      startIso: `${date}T${w.start_time}`,
      durationMinutes: w.duration_minutes,
      caloriesBurned: Number(w.calories_burned),
      source: w.source as "manual" | "apple_health",
    } satisfies WorkoutCardData,
  }));

  // Unified chronological timeline — meals and workouts interleaved by time,
  // rather than grouped into separate meal-type sections.
  const timeline = [...mealEntries, ...workoutEntries].sort((a, b) => a.sortIso.localeCompare(b.sortIso));

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-cream-100">Today</h1>
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

      {/* Water gets its own section, separate from the timeline below */}
      <WaterSummaryCard
        initialMl={Math.round(Number(totals?.water_ml ?? 0))}
        targetMl={goals?.water_target_ml ?? 2500}
      />

      {timeline.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing logged this day"
          description="Tap the + button to log a meal or a workout — everything shows up here in order."
        />
      ) : (
        <div className="space-y-2.5">
          {timeline.map((entry) =>
            entry.kind === "meal" ? (
              <MealCard key={`meal-${entry.data.id}`} meal={entry.data} href={`/meals/${entry.data.id}`} />
            ) : (
              <WorkoutCard key={`workout-${entry.data.id}`} workout={entry.data} href={`/workouts/${entry.data.id}`} />
            )
          )}
        </div>
      )}
    </div>
  );
}
