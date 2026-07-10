import { average, calcConsistency } from "./consistency";

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
  calories: number;
  protein: number;
  fibre: number;
  water: number;
}

export function calcWeekConsistencies(
  totals: Array<{ calories: number; protein_g: number; fibre_g: number; water_ml: number }>,
  goals: { calorie_target: number; protein_target_g: number; fibre_target_g: number; water_target_ml: number }
): WeekConsistencies {
  return {
    calories: calcConsistency(
      totals.map((t) => t.calories),
      goals.calorie_target
    ),
    protein: calcConsistency(
      totals.map((t) => t.protein_g),
      goals.protein_target_g
    ),
    fibre: calcConsistency(
      totals.map((t) => t.fibre_g),
      goals.fibre_target_g
    ),
    water: calcConsistency(
      totals.map((t) => t.water_ml),
      goals.water_target_ml
    ),
  };
}
