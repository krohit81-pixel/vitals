export interface StreakDay {
  date: string;
  hit: boolean;
}

/**
 * A day counts as a "hit" if something was actually logged (otherwise an
 * empty day would trivially pass) and net calories (consumed − burned) stayed
 * at or under target, with a small 5% tolerance so a slightly-over day
 * doesn't feel punishing — this is meant to motivate, not gatekeep.
 */
export function computeStreakDays(
  days: Array<{ date: string; calories: number; caloriesBurned: number }>,
  calorieTarget: number
): StreakDay[] {
  return days.map((d) => {
    const hasData = d.calories > 0;
    const net = d.calories - d.caloriesBurned;
    const withinBudget = net <= calorieTarget * 1.05;
    return { date: d.date, hit: hasData && withinBudget };
  });
}

/** Current streak length, counting backwards from the last day while it keeps hitting. */
export function currentStreakLength(days: StreakDay[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (!days[i]!.hit) break;
    streak++;
  }
  return streak;
}
