import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { LocalTime } from "./local-time";

export interface MealCardData {
  id: string;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  loggedAtIso: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  photoUrl?: string;
}

export function MealCard({
  meal,
  href,
  onTap,
}: {
  meal: MealCardData;
  /** Link to the meal's detail page — pass this to make the card navigate there. */
  href?: string;
  onTap?: () => void;
}) {
  const content = (
    <>
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
          <LocalTime iso={meal.loggedAtIso} className="text-xs text-black/40 dark:text-white/40" />
        </div>
        <p className="truncate font-display text-sm font-medium text-ink dark:text-cream-100">{meal.name}</p>
        <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
          {meal.calories} kcal · {meal.proteinG}p · {meal.carbsG}c · {meal.fatG}f
        </p>
      </div>
    </>
  );

  const className = "pressable glass-card flex w-full items-center gap-3 p-3 text-left";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onTap} className={className}>
      {content}
    </button>
  );
}
