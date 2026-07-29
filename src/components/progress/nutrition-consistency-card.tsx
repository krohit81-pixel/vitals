import Link from "next/link";
import { Apple, ChevronRight } from "lucide-react";
import { ScoreBreakdown, type ScoreBreakdownItem } from "./score-breakdown";
import type { WeekConsistencyDetails } from "@/lib/nutrition/coach-insights";

const COLOR = "#10B981";

export function NutritionConsistencyCard({ details }: { details: WeekConsistencyDetails }) {
  const items: ScoreBreakdownItem[] = [
    { label: "Calories", hits: details.calories.hits, total: details.calories.total, direction: "max", color: "#10B981" },
    { label: "Protein", hits: details.protein.hits, total: details.protein.total, direction: "min", color: "#059669" },
    { label: "Carbs", hits: details.carbs.hits, total: details.carbs.total, direction: "max", color: "#3B82F6" },
    { label: "Fat", hits: details.fat.hits, total: details.fat.total, direction: "max", color: "#F59E0B" },
    { label: "Fibre", hits: details.fibre.hits, total: details.fibre.total, direction: "min", color: "#0EA5E9" },
    { label: "Water", hits: details.water.hits, total: details.water.total, direction: "min", color: "#38BDF8" },
  ];

  return (
    <Link href="/progress/nutrition" className="pressable glass-card block p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${COLOR}22` }}>
            <Apple size={14} style={{ color: COLOR }} />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            Nutrition consistency
          </span>
        </div>
        <ChevronRight size={15} className="text-black/25 dark:text-white/25" />
      </div>

      <ScoreBreakdown items={items} />
    </Link>
  );
}
