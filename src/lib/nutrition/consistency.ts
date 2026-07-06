/**
 * % of days that reached at least `thresholdPct` of the target. Defaults to
 * 80% — hitting most, not necessarily all, of a target still counts as
 * "on track" for day-to-day nutrition, unlike a strict >= target check which
 * would make the score swing wildly on ordinary days.
 */
export function calcConsistency(values: number[], target: number, thresholdPct = 0.8): number {
  if (values.length === 0 || target <= 0) return 0;
  const hits = values.filter((v) => v >= target * thresholdPct).length;
  return Math.round((hits / values.length) * 100);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function total(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}
