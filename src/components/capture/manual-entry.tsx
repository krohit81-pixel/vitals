"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManualEntry({
  onAnalyze,
  shortcuts,
}: {
  onAnalyze: (description: string) => void;
  shortcuts: string[];
}) {
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

      {shortcuts.length > 0 && (
        // Grid, not a horizontal wrap of pills — a pill sized for "Dal rice"
        // can't also hold a 50-character phrase without either overflowing
        // its own edge or forcing the pill absurdly wide. Fixed-width grid
        // cells with wrapping text solve both: every chip is the same size
        // regardless of label length, and nothing is ever cut off.
        <div className="grid grid-cols-2 gap-2">
          {shortcuts.map((label) => (
            <button
              key={label}
              onClick={() => setText(label)}
              className="rounded-xl border border-black/[0.08] px-3 py-2.5 text-left text-xs leading-snug text-black/60 hover:bg-black/[0.03] dark:border-white/[0.1] dark:text-white/60 dark:hover:bg-white/[0.06]"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <Button size="lg" disabled={!text.trim()} onClick={() => onAnalyze(text.trim())}>
        Analyze meal
      </Button>
    </div>
  );
}
