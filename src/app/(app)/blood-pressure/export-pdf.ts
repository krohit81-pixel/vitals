"use client";

import type { BpEntry } from "./bp-list";

/**
 * Generates the PDF entirely client-side (jsPDF + jspdf-autotable, lazy-
 * loaded so the extra ~200KB only loads when this button is actually
 * clicked) rather than relying on window.print() — see ARCHITECTURE.md bug
 * class #11 for why: window.print() silently does nothing on iOS when the
 * app is running as an installed home-screen PWA, and even the documented
 * "<a target=_blank> to escape to Safari" workaround turned out unreliable
 * (a same-origin navigation inside a standalone webview can just no-op).
 * A real generated PDF + browser download sidesteps the print dialog
 * entirely, so it works the same everywhere.
 */
export async function exportBloodPressurePdf(entries: BpEntry[]) {
  const [{ default: jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Vitals — Blood Pressure Log", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(130);
  doc.text(`Generated ${new Date().toLocaleDateString(undefined, { dateStyle: "medium" })}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [["Date & time", "Systolic", "Diastolic", "Notes"]],
    body: entries.map((e) => [
      new Date(e.measured_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
      String(e.systolic),
      String(e.diastolic),
      e.notes ?? "",
    ]),
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 3: { cellWidth: 70 } },
  });

  doc.save(`vitals-blood-pressure-${new Date().toISOString().slice(0, 10)}.pdf`);
}
