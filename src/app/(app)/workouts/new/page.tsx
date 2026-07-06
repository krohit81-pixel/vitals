"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { localTodayString } from "@/lib/nutrition/date";
import { createWorkoutAction } from "../actions";

export default function NewWorkoutPage() {
  const router = useRouter();

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Log a workout</h1>
      </div>

      <WorkoutForm action={createWorkoutAction} defaults={{ date: localTodayString() }} submitLabel="Save workout" />
    </div>
  );
}
