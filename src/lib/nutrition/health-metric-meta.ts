export interface HealthMetricMeta {
  label: string;
  unit: string;
  color: string;
  /** Round to whole numbers for display, or keep one decimal (HRV, distance in km). */
  decimals: number;
}

export const HEALTH_METRIC_META: Record<string, HealthMetricMeta> = {
  step_count: { label: "Steps", unit: "steps", color: "#F59E0B", decimals: 0 },
  distance_walking_running: { label: "Distance", unit: "km", color: "#3B82F6", decimals: 1 },
  active_energy_burned: { label: "Active Calories", unit: "kcal", color: "#EF4444", decimals: 0 },
  basal_energy_burned: { label: "Resting Calories", unit: "kcal", color: "#F59E0B", decimals: 0 },
  flights_climbed: { label: "Flights Climbed", unit: "floors", color: "#10B981", decimals: 0 },
  heart_rate: { label: "Heart Rate", unit: "bpm", color: "#EF4444", decimals: 0 },
  resting_heart_rate: { label: "Resting Heart Rate", unit: "bpm", color: "#EF4444", decimals: 0 },
  heart_rate_variability: { label: "HRV", unit: "ms", color: "#F59E0B", decimals: 0 },
  oxygen_saturation: { label: "Blood Oxygen", unit: "%", color: "#3B82F6", decimals: 0 },
};

export function metricMeta(metric: string): HealthMetricMeta {
  return HEALTH_METRIC_META[metric] ?? { label: metric, unit: "", color: "#10B981", decimals: 0 };
}

/** distance_walking_running is imported in meters — convert for display. */
export function convertMetricValue(metric: string, value: number): number {
  if (metric === "distance_walking_running") return value / 1000;
  return value;
}
