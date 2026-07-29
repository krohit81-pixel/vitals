import { average, calcConsistencyDetail, type ConsistencyDetail } from "./consistency";

// Re-exported because callers keep reasonably assuming this lives here
// alongside the other week-level helpers — easier to fix the import surface
// once than keep fixing the same mistake at every call site.
export { average };

export type TrendDirection = "up" | "down" | "flat";

/** Compares the first half of the week's average to the second half's. */
export function trendDirection(values: number[]): TrendDirection {
  if (values.length < 4) return "flat";
  const mid = Math.floor(values.length / 2);
  const firstHalf = average(values.slice(0, mid));
  const secondHalf = average(values.slice(mid));
  const delta = secondHalf - firstHalf;
  const threshold = Math.max(firstHalf * 0.08, 1); // ignore noise under ~8%
  if (delta > threshold) return "up";
  if (delta < -threshold) return "down";
  return "flat";
}

export interface RhythmScore {
  score: number; // 0-100
  label: string;
}

/**
 * A single composite score across the week's main targets — meant as one
 * friendly number, not a report card. Framing is deliberately positive at
 * every tier; there's no "you failed" tier, per the no-shaming principle
 * carried over from the AI Coach prompt itself.
 */
export function calcRhythmScore(consistencies: number[]): RhythmScore {
  const score = Math.round(average(consistencies));
  const label =
    score >= 85 ? "Locked in" : score >= 65 ? "Building momentum" : score >= 40 ? "Getting started" : "Just getting going";
  return { score, label };
}

export interface WeekConsistencies {
  /** "On track" here means stayed at or under budget — going over is the
   * thing being avoided, so this is a "max" (ceiling) metric. */
  calories: number;
  /** "On track" means reached the target — going over is still fine, so
   * this is a "min" (floor) metric, same as fibre/water. */
  protein: number;
  fibre: number;
  water: number;
  /** Budgets, like calories — going over is the thing being tracked. */
  carbs: number;
  fat: number;
}

export interface WeekConsistencyDetails {
  calories: ConsistencyDetail;
  protein: ConsistencyDetail;
  fibre: ConsistencyDetail;
  water: ConsistencyDetail;
  carbs: ConsistencyDetail;
  fat: ConsistencyDetail;
}

type WeekTotalsInput = { calories: number; protein_g: number; fibre_g: number; water_ml: number; carbs_g: number; fat_g: number };
type WeekGoalsInput = {
  calorie_target: number;
  protein_target_g: number;
  fibre_target_g: number;
  water_target_ml: number;
  carb_target_g: number;
  fat_target_g: number;
};

/** The single source of truth for "on track" per nutrition metric — hits,
 * total days, and which direction "on track" even means for that metric.
 * `calcWeekConsistencies` below is a thin percent-only view over this, kept
 * for callers that only ever wanted the number. */
export function calcWeekConsistencyDetails(totals: WeekTotalsInput[], goals: WeekGoalsInput): WeekConsistencyDetails {
  return {
    calories: calcConsistencyDetail(totals.map((t) => t.calories), goals.calorie_target, "max"),
    protein: calcConsistencyDetail(totals.map((t) => t.protein_g), goals.protein_target_g, "min"),
    fibre: calcConsistencyDetail(totals.map((t) => t.fibre_g), goals.fibre_target_g, "min"),
    water: calcConsistencyDetail(totals.map((t) => t.water_ml), goals.water_target_ml, "min"),
    carbs: calcConsistencyDetail(totals.map((t) => t.carbs_g), goals.carb_target_g, "max"),
    fat: calcConsistencyDetail(totals.map((t) => t.fat_g), goals.fat_target_g, "max"),
  };
}

export function calcWeekConsistencies(totals: WeekTotalsInput[], goals: WeekGoalsInput): WeekConsistencies {
  const details = calcWeekConsistencyDetails(totals, goals);
  return {
    calories: details.calories.pct,
    protein: details.protein.pct,
    fibre: details.fibre.pct,
    water: details.water.pct,
    carbs: details.carbs.pct,
    fat: details.fat.pct,
  };
}
