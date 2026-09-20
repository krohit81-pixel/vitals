"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingRing } from "@/components/shared/loading-ring";
import { LocalDateTime } from "@/components/shared/local-time";
import { exportBloodPressurePdf } from "./export-pdf";

export interface BpEntry {
  id: string;
  systolic: number;
  diastolic: number;
  measured_at: string;
  notes: string | null;
}

export function BloodPressureList({ entries }: { entries: BpEntry[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      try {
        await exportBloodPressurePdf(entries);
      } catch {
        setError("Couldn't generate the PDF — try again.");
      }
    });
  };

  return (
    <>
      <div className="print:hidden">
        <Button onClick={handleExport} disabled={pending} variant="outline" size="md" className="w-full">
          {pending ? <LoadingRing size={15} className="text-current" /> : <Printer size={16} />}
          {pending ? "Preparing PDF…" : "Export PDF"}
        </Button>
        {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
      </div>

      {/* Interactive on-screen list — hidden on the printed page in favor of
          the plain table below, which is what "export in tabular format"
          actually asked for. */}
      <div className="space-y-2 print:hidden">
        {entries.map((e) => (
          <Link
            key={e.id}
            href={`/blood-pressure/${e.id}`}
            className="pressable glass-card flex items-center justify-between p-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold tabular-nums text-ink dark:text-cream-100">
                {e.systolic} / {e.diastolic} <span className="text-xs font-normal text-black/40 dark:text-white/40">mmHg</span>
              </p>
              {e.notes && <p className="mt-0.5 truncate text-xs text-black/45 dark:text-white/45">{e.notes}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LocalDateTime iso={e.measured_at} className="text-xs text-black/40 dark:text-white/40" />
              <ChevronRight size={15} className="text-black/25 dark:text-white/25" />
            </div>
          </Link>
        ))}
      </div>

      {/* Print-only table — a courtesy for anyone who prints manually
          (Cmd/Ctrl+P) instead of using "Export PDF" above, which generates
          the real PDF directly (see export-pdf.ts) and doesn't depend on
          this markup or the browser's print dialog at all. */}
      <table className="hidden w-full border-collapse text-left text-sm print:table">
        <caption className="mb-3 text-left font-display text-lg font-semibold text-black">
          Vitals — Blood Pressure Log
        </caption>
        <thead>
          <tr className="border-b border-black/20">
            <th className="py-1.5 pr-3 font-medium text-black/60">Date &amp; time</th>
            <th className="py-1.5 pr-3 font-medium text-black/60">Systolic</th>
            <th className="py-1.5 pr-3 font-medium text-black/60">Diastolic</th>
            <th className="py-1.5 font-medium text-black/60">Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-black/10">
              <td className="py-1.5 pr-3 text-black">
                <LocalDateTime iso={e.measured_at} />
              </td>
              <td className="py-1.5 pr-3 tabular-nums text-black">{e.systolic}</td>
              <td className="py-1.5 pr-3 tabular-nums text-black">{e.diastolic}</td>
              <td className="py-1.5 text-black">{e.notes ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
