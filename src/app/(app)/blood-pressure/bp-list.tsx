"use client";

import Link from "next/link";
import { ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocalDateTime } from "@/components/shared/local-time";

export interface BpEntry {
  id: string;
  systolic: number;
  diastolic: number;
  measured_at: string;
  notes: string | null;
}

export function BloodPressureList({ entries }: { entries: BpEntry[] }) {
  return (
    <>
      <Button onClick={() => window.print()} variant="outline" size="md" className="w-full print:hidden">
        <Printer size={16} /> Export PDF
      </Button>

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

      {/* Print-only tabular export — this is the actual PDF output
          (window.print()'s "Save as PDF"). Nav chrome/buttons/the card list
          above all hide themselves via print:hidden globally/here. */}
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
