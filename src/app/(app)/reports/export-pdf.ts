"use client";

import type { ScoreBreakdownItem } from "@/components/progress/score-breakdown";
import type { WeeklyReportStats } from "./report-view";

/** Same reasoning as blood-pressure/export-pdf.ts — a real generated PDF
 * (jsPDF + jspdf-autotable, lazy-loaded) instead of window.print(), which
 * silently does nothing on iOS in a standalone home-screen install. See
 * ARCHITECTURE.md bug class #11. */
export async function exportWeeklyReportPdf(input: {
  weekLabel: string;
  focusAreas: ScoreBreakdownItem[];
  accomplishments: string[];
  upcomingFocus: string;
  stats: WeeklyReportStats;
}) {
  const [{ default: jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF();
  const marginX = 14;
  let y = 18;

  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text("Vitals — Weekly Report", marginX, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(130);
  doc.text(input.weekLabel, marginX, y);
  y += 10;

  doc.setTextColor(20);
  doc.setFontSize(11);
  doc.text(
    `Avg calories: ${Math.round(input.stats.avgCalories).toLocaleString()}   ·   Workouts: ${input.stats.totalWorkouts}   ·   Streak: ${input.stats.streak}d`,
    marginX,
    y
  );
  y += 10;

  doc.setFontSize(12);
  doc.text("Focus areas this week", marginX, y);
  y += 2;

  if (input.focusAreas.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Hit rate", "Direction"]],
      body: input.focusAreas.map((f) => [f.label, `${f.hits}/${f.total}`, f.direction === "min" ? "Reach" : "Stay under"]),
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: marginX },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(130);
    doc.text("Nothing logged this week yet.", marginX, y + 6);
    doc.setTextColor(20);
    y += 14;
  }

  doc.setFontSize(12);
  doc.text("Accomplishments", marginX, y);
  y += 7;
  doc.setFontSize(10);
  if (input.accomplishments.length > 0) {
    for (const label of input.accomplishments) {
      doc.text(`•  ${label}`, marginX + 2, y);
      y += 6;
    }
  } else {
    doc.setTextColor(130);
    doc.text("No milestones hit this week.", marginX, y);
    doc.setTextColor(20);
    y += 6;
  }
  y += 4;

  doc.setFontSize(12);
  doc.text("Focus for next week", marginX, y);
  y += 7;
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(input.upcomingFocus, 180) as string[];
  doc.text(lines, marginX, y);

  const fileSlug = input.weekLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-+|-+$/g, "");
  doc.save(`vitals-weekly-report-${fileSlug}.pdf`);
}
