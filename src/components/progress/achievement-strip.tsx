import { Footprints, Flame, Beef, Dumbbell, Target, Trophy } from "lucide-react";
import type { Achievement } from "@/lib/nutrition/achievements";

const ICONS: Record<string, typeof Trophy> = {
  "10,000 Steps": Footprints,
  "5 Day Streak": Flame,
  "Protein Goal 7 Days": Beef,
  "Active Week": Dumbbell,
  "Weight Goal 50%": Target,
};

export function AchievementStrip({ achievements }: { achievements: Achievement[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Trophy size={15} className="text-amber-500" />
        <h2 className="font-display text-base font-medium text-ink dark:text-cream-100">Achievements</h2>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {achievements.map((a) => {
          const Icon = ICONS[a.label] ?? Trophy;
          return (
            <div
              key={a.label}
              className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 ${
                a.achieved
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                  : "bg-black/[0.04] text-black/35 dark:bg-white/[0.06] dark:text-white/35"
              }`}
            >
              <Icon size={18} />
              <span className="whitespace-nowrap text-[11px] font-medium">{a.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
