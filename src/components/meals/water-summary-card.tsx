"use client";

import { useState, useTransition } from "react";
import { Droplets, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { logWaterAction } from "@/lib/nutrition/water-actions";

export function WaterSummaryCard({ initialMl, targetMl }: { initialMl: number; targetMl: number }) {
  const [totalMl, setTotalMl] = useState(initialMl);
  const [justAdded, setJustAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  const quickAdd = (amount: number) => {
    startTransition(async () => {
      const newTotal = await logWaterAction(amount);
      setTotalMl(newTotal);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    });
  };

  const pct = Math.min((totalMl / targetMl) * 100, 100);

  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15">
        {justAdded ? (
          <Check size={20} className="text-sky-500" />
        ) : (
          <Droplets size={20} className="text-sky-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
            Water
          </span>
          <span className="text-xs text-black/40 dark:text-white/40">
            {totalMl} / {targetMl} ml
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <button
        disabled={pending}
        onClick={() => quickAdd(250)}
        aria-label="Add 250ml of water"
        className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white disabled:opacity-50"
      >
        <Plus size={16} />
      </button>
    </Card>
  );
}
