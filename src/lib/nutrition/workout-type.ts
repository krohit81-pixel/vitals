import {
  Footprints,
  PersonStanding,
  Bike,
  Waves,
  Dumbbell,
  Flame,
  Sparkles as YogaIcon,
  Ship,
  Mountain,
  Trophy,
  Activity,
  type LucideIcon,
} from "lucide-react";

export type WorkoutType =
  | "walking"
  | "running"
  | "elliptical"
  | "cycling"
  | "swimming"
  | "strength_training"
  | "hiit"
  | "yoga"
  | "rowing"
  | "hiking"
  | "sports"
  | "other";

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  walking: "Walking",
  running: "Running",
  elliptical: "Elliptical",
  cycling: "Cycling",
  swimming: "Swimming",
  strength_training: "Strength Training",
  hiit: "HIIT",
  yoga: "Yoga",
  rowing: "Rowing",
  hiking: "Hiking",
  sports: "Sports",
  other: "Other",
};

export const WORKOUT_TYPE_ICONS: Record<WorkoutType, LucideIcon> = {
  walking: Footprints,
  running: PersonStanding,
  elliptical: Activity,
  cycling: Bike,
  swimming: Waves,
  strength_training: Dumbbell,
  hiit: Flame,
  yoga: YogaIcon,
  rowing: Ship,
  hiking: Mountain,
  sports: Trophy,
  other: Activity,
};

export const WORKOUT_TYPES = Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[];
