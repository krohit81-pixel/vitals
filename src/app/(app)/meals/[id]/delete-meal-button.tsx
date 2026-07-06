"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteMealAction } from "./actions";

export function DeleteMealButton({ mealId }: { mealId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-black/50 dark:text-white/50">Delete this meal?</span>
        <button
          disabled={pending}
          onClick={() => startTransition(() => deleteMealAction(mealId))}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
        <button
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-black/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-sm font-medium text-red-500"
    >
      <Trash2 size={15} /> Delete
    </button>
  );
}
