import Link from "next/link";
import { Watch } from "lucide-react";
import { LocalTime } from "./local-time";
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_ICONS, type WorkoutType } from "@/lib/nutrition/workout-type";

export interface WorkoutCardData {
  id: string;
  workoutType: WorkoutType;
  startIso: string; // combined date + start_time, for chronological sort + LocalTime
  durationMinutes: number;
  caloriesBurned: number;
  source: "manual" | "apple_health";
}

export function WorkoutCard({ workout, href }: { workout: WorkoutCardData; href: string }) {
  const Icon = WORKOUT_TYPE_ICONS[workout.workoutType];

  return (
    <Link href={href} className="pressable glass-card flex w-full items-center gap-3 p-3 text-left">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
        <Icon size={24} className="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            {WORKOUT_TYPE_LABELS[workout.workoutType]}
            {workout.source === "apple_health" && <Watch size={11} className="opacity-70" />}
          </span>
          <LocalTime iso={workout.startIso} className="text-xs text-black/40 dark:text-white/40" />
        </div>
        <p className="font-display text-sm font-medium text-ink dark:text-cream-100">
          {workout.durationMinutes} min
        </p>
        <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
          {Math.round(workout.caloriesBurned)} kcal burned
        </p>
      </div>
    </Link>
  );
}
