import Image from "next/image";
import { cn } from "@/lib/utils";

export interface MealCardData {
  id: string;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  time: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  photoUrl?: string;
}

export function MealCard({ meal, onTap }: { meal: MealCardData; onTap?: () => void }) {
  return (
    <button
      onClick={onTap}
      className="pressable glass-card flex w-full items-center gap-3 p-3 text-left"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/[0.04] dark:bg-white/[0.06]">
        {meal.photoUrl ? (
          <Image src={meal.photoUrl} alt={meal.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">🍽️</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className={cn("text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400")}>
            {meal.type}
          </span>
          <span className="text-xs text-black/40 dark:text-white/40">{meal.time}</span>
        </div>
        <p className="truncate font-display text-sm font-medium text-ink dark:text-cream-100">{meal.name}</p>
        <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
          {meal.calories} kcal · {meal.proteinG}p · {meal.carbsG}c · {meal.fatG}f
        </p>
      </div>
    </button>
  );
}
