export interface StreakDay {
  date: string;
  hit: boolean;
}

export type StreakDisplayState = "hit" | "miss" | "pending" | "future";

/**
 * A day counts as a "hit" if something was actually logged (otherwise an
 * empty day would trivially pass) and net calories (consumed − burned) stayed
 * at or under target — the same exact definition the calorie ring uses for
 * its over/under state, so the two don't disagree with each other. No grace
 * margin: even a small overage is a miss, matching the ring turning red the
 * moment you cross target.
 */
export function computeStreakDays(
  days: Array<{ date: string; calories: number; caloriesBurned: number }>,
  calorieTarget: number
): StreakDay[] {
  return days.map((d) => {
    const hasData = d.calories > 0;
    const net = d.calories - d.caloriesBurned;
    const withinBudget = net <= calorieTarget;
    return { date: d.date, hit: hasData && withinBudget };
  });
}

/**
 * What to actually display for a day. `today` must come from the caller's
 * browser (see localTodayString()) — a server-computed "today" would use the
 * server's UTC clock, same bug class as meal timestamps/greeting elsewhere.
 * Today itself is always "pending": the day isn't over, so it can't have
 * succeeded or failed yet, regardless of how it's trending so far.
 */
export function classifyStreakDay(day: StreakDay, today: string): StreakDisplayState {
  if (day.date > today) return "future";
  if (day.date === today) return "pending";
  return day.hit ? "hit" : "miss";
}

/** Streak length counting backward from the most recent *finished* day — today is never counted, since it isn't over yet. */
export function currentStreakLength(days: StreakDay[], today: string): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i]!;
    if (day.date >= today) continue;
    if (!day.hit) break;
    streak++;
  }
  return streak;
}
