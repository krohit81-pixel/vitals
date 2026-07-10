import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RangeSelector } from "@/components/progress/range-selector";
import { MetricTrendCard } from "@/components/analytics/metric-trend-card";
import { MacroSplitCard } from "@/components/analytics/macro-split-card";
import { getDailyTotalsRange } from "@/lib/nutrition/get-range-totals";
import { addDays, rangeToDays, type RangeOption } from "@/lib/nutrition/date";

export default async function ProgressNutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = (["7d", "30d", "90d", "1y"].includes(sp.range ?? "") ? sp.range : "7d") as RangeOption;
  const days = rangeToDays(range);
  const today = new Date().toISOString().slice(0, 10);
  const start = addDays(today, -(days - 1));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: goalsRow }, totals] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user!.id).single(),
    getDailyTotalsRange(supabase, user!.id, start, today),
  ]);

  const goals = goalsRow ?? {
    calorie_target: 2000,
    protein_target_g: 120,
    carb_target_g: 220,
    fat_target_g: 65,
    fibre_target_g: 30,
    water_target_ml: 2500,
  };

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/progress" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Nutrition</h1>
      </div>

      <RangeSelector range={range} />

      <MacroSplitCard data={totals.map((t) => ({ date: t.date, fatG: t.fat_g, carbsG: t.carbs_g, proteinG: t.protein_g }))} />

      <MetricTrendCard label="Calories" unit="kcal" color="#10B981" target={goals.calorie_target} data={totals.map((t) => ({ date: t.date, value: t.calories }))} />
      <MetricTrendCard label="Protein" unit="g" color="#10B981" target={goals.protein_target_g} data={totals.map((t) => ({ date: t.date, value: t.protein_g }))} />
      <MetricTrendCard label="Water" unit="ml" color="#3B82F6" target={goals.water_target_ml} data={totals.map((t) => ({ date: t.date, value: t.water_ml }))} />
    </div>
  );
}
