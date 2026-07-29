export type ConsistencyDirection = "min" | "max";

export interface ConsistencyDetail {
  pct: number;
  hits: number;
  total: number;
  direction: ConsistencyDirection;
}

/**
 * % of days that stayed on the right side of `target`, direction-aware:
 * - "min" targets (protein, fibre, water, steps) — more is fine or even
 *   good, so a day "hits" once it reaches at least `target * (1 -
 *   tolerancePct)`. Defaults to an 80%-of-target floor — hitting most, not
 *   necessarily all, of a target still counts as "on track" day-to-day,
 *   unlike a strict >= target check which would make the score swing wildly
 *   on ordinary days.
 * - "max" targets (calories, carbs, fat) are budgets, not floors — going
 *   over is the thing being tracked, so a day "hits" if it stays at or under
 *   `target * (1 + tolerancePct)`. The same 20% grace applies in the other
 *   direction, so a slightly-over day doesn't tank the score either.
 */
export function calcConsistencyDetail(
  values: number[],
  target: number,
  direction: ConsistencyDirection = "min",
  tolerancePct = 0.2
): ConsistencyDetail {
  if (values.length === 0 || target <= 0) {
    return { pct: 0, hits: 0, total: values.length, direction };
  }
  const hits = values.filter((v) =>
    direction === "min" ? v >= target * (1 - tolerancePct) : v <= target * (1 + tolerancePct)
  ).length;
  return { pct: Math.round((hits / values.length) * 100), hits, total: values.length, direction };
}

export function calcConsistency(
  values: number[],
  target: number,
  direction: ConsistencyDirection = "min",
  tolerancePct = 0.2
): number {
  return calcConsistencyDetail(values, target, direction, tolerancePct).pct;
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function total(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}
