"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const EXAMPLES = ["2 eggs and toast", "Chicken biryani", "Paneer tikka", "Dal rice"];

export function ManualEntry({ onAnalyze }: { onAnalyze: (description: string) => void }) {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-4 py-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe what you ate, e.g. '2 eggs and toast'"
        rows={4}
        className="w-full resize-none rounded-xl border border-black/[0.08] bg-white/70 p-4 text-sm outline-none placeholder:text-black/35 focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:placeholder:text-white/35"
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setText(ex)}
            className="rounded-full border border-black/[0.08] px-3 py-1.5 text-xs text-black/60 hover:bg-black/[0.03] dark:border-white/[0.1] dark:text-white/60 dark:hover:bg-white/[0.06]"
          >
            {ex}
          </button>
        ))}
      </div>

      <Button size="lg" disabled={!text.trim()} onClick={() => onAnalyze(text.trim())}>
        Analyze meal
      </Button>
    </div>
  );
}
