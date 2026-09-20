"use client";

import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingRing } from "@/components/shared/loading-ring";
import { logBloodPressureAction } from "./actions";

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BloodPressureForm() {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [notes, setNotes] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");
  const [maxMeasuredAt, setMaxMeasuredAt] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Computed client-side, not on the server — same "now" is whatever the
  // viewer's own clock/timezone says, not Vercel's UTC clock.
  useEffect(() => {
    const now = toDatetimeLocal(new Date());
    setMeasuredAt(now);
    setMaxMeasuredAt(now);
  }, []);

  const handleSave = () => {
    setError(null);
    const sys = Number(systolic);
    const dia = Number(diastolic);
    if (!sys || !dia) {
      setError("Enter both systolic and diastolic readings.");
      return;
    }
    startTransition(async () => {
      try {
        await logBloodPressureAction(sys, dia, new Date(measuredAt).toISOString(), notes.trim() || undefined);
        setSystolic("");
        setDiastolic("");
        setNotes("");
        setMeasuredAt(toDatetimeLocal(new Date()));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save that reading.");
      }
    });
  };

  return (
    <div className="glass-card-solid space-y-4 p-5 print:hidden">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-black/60 dark:text-white/60">Systolic (high)</label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="120"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            className="text-lg font-semibold tabular-nums"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-black/60 dark:text-white/60">Diastolic (low)</label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="80"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            className="text-lg font-semibold tabular-nums"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-black/60 dark:text-white/60">Date &amp; time</label>
        <Input
          type="datetime-local"
          value={measuredAt}
          max={maxMeasuredAt}
          onChange={(e) => setMeasuredAt(e.target.value)}
        />
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional) — e.g. after exercise, felt dizzy, left arm"
        rows={2}
        className="w-full resize-none rounded-xl border border-black/[0.08] bg-white/70 p-3 text-sm outline-none placeholder:text-black/35 focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:placeholder:text-white/35"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handleSave} disabled={pending} size="lg" className="w-full">
        {pending && <LoadingRing size={15} className="text-white" />}
        {pending ? "Saving…" : "Add reading"}
      </Button>
    </div>
  );
}
