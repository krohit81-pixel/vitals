export interface Achievement {
  label: string;
  achieved: boolean;
}

export function computeAchievements(input: {
  maxSteps: number;
  currentStreak: number;
  proteinConsistencyPct: number;
  weightGoalProgressPct: number | null;
  maxWorkoutsInAWeek: number;
}): Achievement[] {
  const achievements: Achievement[] = [
    { label: "10,000 Steps", achieved: input.maxSteps >= 10000 },
    { label: "5 Day Streak", achieved: input.currentStreak >= 5 },
    { label: "Protein Goal 7 Days", achieved: input.proteinConsistencyPct >= 100 },
    { label: "Active Week", achieved: input.maxWorkoutsInAWeek >= 4 },
  ];

  if (input.weightGoalProgressPct !== null) {
    achievements.push({ label: "Weight Goal 50%", achieved: input.weightGoalProgressPct >= 50 });
  }

  return achievements;
}
