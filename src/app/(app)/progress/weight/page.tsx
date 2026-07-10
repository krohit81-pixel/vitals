import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { MetricDetailChart } from "@/components/progress/metric-detail-chart";
import { average } from "@/lib/nutrition/consistency";
import { addDays } from "@/lib/nutrition/date";

export default async function ProgressWeightPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: logs }, { data: goals }, { data: profile }] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("weight, unit, measured_at")
      .eq("user_id", user!.id)
      .order("measured_at", { ascending: true }),
    supabase.from("goals").select("goal_weight_kg").eq("user_id", user!.id).single(),
    supabase.from("users").select("height_cm").eq("id", user!.id).single(),
  ]);

  const entries = logs ?? [];
  const current = entries[entries.length - 1];
  const earliest = entries[0];
  const unit = current?.unit ?? "kg";

  const chartData = entries.map((e) => ({
    date: e.measured_at.slice(0, 10),
    value: e.weight,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = addDays(today, -6);
  const monthAgo = addDays(today, -29);
  const weeklyAvg = average(entries.filter((e) => e.measured_at.slice(0, 10) >= weekAgo).map((e) => e.weight));
  const monthlyAvg = average(entries.filter((e) => e.measured_at.slice(0, 10) >= monthAgo).map((e) => e.weight));

  const weightLost = current && earliest ? earliest.weight - current.weight : null;

  // BMI needs weight in kg and height in meters — convert if the user logs in lb.
  const weightKg = current ? (current.unit === "lb" ? current.weight * 0.453592 : current.weight) : null;
  const heightM = profile?.height_cm ? profile.height_cm / 100 : null;
  const bmi = weightKg && heightM ? weightKg / (heightM * heightM) : null;

  // Simple linear projection to goal weight based on the trend over the logged history.
  let projectedDate: string | null = null;
  if (current && earliest && goals?.goal_weight_kg && entries.length >= 3) {
    const daysElapsed = Math.max(
      1,
      (new Date(current.measured_at).getTime() - new Date(earliest.measured_at).getTime()) / 86400000
    );
    const ratePerDay = (earliest.weight - current.weight) / daysElapsed;
    const remaining = current.weight - goals.goal_weight_kg;
    if (ratePerDay > 0 && remaining > 0) {
      const daysToGoal = Math.round(remaining / ratePerDay);
      projectedDate = new Date(Date.now() + daysToGoal * 86400000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/progress" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Weight</h1>
        </div>
        <Link href="/weight" className="flex items-center gap-1.5 text-sm font-medium text-black/50 dark:text-white/50">
          <Settings2 size={14} /> Manage
        </Link>
      </div>

      {entries.length > 0 ? (
        <>
          <Card>
            <MetricDetailChart data={chartData} color="#3B82F6" unit={unit} />
          </Card>

          <Card solid className="grid grid-cols-2 gap-4">
            <Stat label="Current" value={`${current!.weight} ${unit}`} />
            <Stat label="Goal" value={goals?.goal_weight_kg ? `${goals.goal_weight_kg} kg` : "Not set"} />
            <Stat
              label="Total Change"
              value={weightLost !== null ? `${weightLost >= 0 ? "↓" : "↑"} ${Math.abs(weightLost).toFixed(1)} ${unit}` : "—"}
            />
            <Stat label="BMI" value={bmi ? bmi.toFixed(1) : "Add height in Profile"} />
            <Stat label="Weekly Avg" value={weeklyAvg > 0 ? `${weeklyAvg.toFixed(1)} ${unit}` : "—"} />
            <Stat label="Monthly Avg" value={monthlyAvg > 0 ? `${monthlyAvg.toFixed(1)} ${unit}` : "—"} />
          </Card>

          {projectedDate && (
            <Card className="text-center">
              <p className="text-xs text-black/40 dark:text-white/40">Projected goal date</p>
              <p className="font-display text-lg font-semibold text-ink dark:text-cream-100">{projectedDate}</p>
            </Card>
          )}
        </>
      ) : (
        <Card className="py-10 text-center text-sm text-black/50 dark:text-white/50">
          No weight logged yet — tap the + button on the Meals tab and choose Log Weight.
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-black/40 dark:text-white/40">{label}</p>
      <p className="font-display text-base font-semibold text-ink dark:text-cream-100">{value}</p>
    </div>
  );
}
