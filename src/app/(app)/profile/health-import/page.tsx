"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowLeft, UploadCloud, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { importHealthDataAction, type ImportResult } from "./actions";

const initialState: ImportResult = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Importing…" : "Import"}
    </Button>
  );
}

export default function HealthImportPage() {
  const [state, formAction] = useActionState(importHealthDataAction, initialState);

  // HealthSave's timestamps are genuinely UTC — the server has no way to know
  // what timezone to convert them to, so the browser has to tell it. Read
  // once on mount; by the time a real submit can happen, this is already set.
  const [timeZone, setTimeZone] = useState("");
  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Import Health Data</h1>
      </div>

      <Card className="space-y-2 text-sm text-black/60 dark:text-white/60">
        <p>
          Export your data from the <strong>HealthSave</strong> app on your iPhone, then upload the
          JSON file here. Re-uploading the same or an overlapping export is always safe — anything
          already imported is skipped automatically, never duplicated.
        </p>
        <p>Steps, distance, heart rate, HRV, blood oxygen, flights climbed, and workouts are all supported.</p>
      </Card>

      <form action={formAction} className="glass-card-solid space-y-4 p-5">
        <input type="hidden" name="timeZone" value={timeZone} />

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-emerald-500/30 bg-emerald-50 py-10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <UploadCloud size={26} />
          <span className="text-sm font-medium">Choose HealthSave export (.json)</span>
          <input type="file" name="file" accept="application/json,.json" required className="hidden" />
        </label>

        {state.error && <p className="text-sm text-red-500">{state.error}</p>}

        {state.metricsImported !== undefined && (
          <Card solid className="flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
            <p className="text-sm text-black/70 dark:text-white/70">
              Imported <strong>{state.metricsImported}</strong> readings and{" "}
              <strong>{state.workoutsImported}</strong> workouts.
              {state.duplicatesSkipped ? ` ${state.duplicatesSkipped} workout${state.duplicatesSkipped === 1 ? "" : "s"} matched something you'd already logged manually, so ${state.duplicatesSkipped === 1 ? "it wasn't" : "they weren't"} duplicated.` : ""}
              {state.skipped ? ` ${state.skipped} rows couldn't be read and were skipped.` : ""}
            </p>
          </Card>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
