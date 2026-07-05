"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { CaptureSheet } from "./capture-sheet";

export function NavShell({ children }: { children: React.ReactNode }) {
  const [captureOpen, setCaptureOpen] = useState(false);
  const router = useRouter();

  const handleSelect = (label: string) => {
    setCaptureOpen(false);
    // Milestone 2 wires these to the real capture flows (vision pipeline, manual
    // NL parsing, voice transcription). For now, route to the meals tab.
    router.push("/meals");
    console.info(`[capture] selected: ${label}`);
  };

  return (
    <div className="min-h-dvh">
      <Sidebar onCapture={() => setCaptureOpen(true)} />
      <main className="pb-24 md:ml-64 md:pb-8">
        <div className="mx-auto max-w-2xl px-4 pt-6 md:px-8 md:pt-10">{children}</div>
      </main>
      <BottomNav onCapture={() => setCaptureOpen(true)} />
      <CaptureSheet open={captureOpen} onClose={() => setCaptureOpen(false)} onSelect={handleSelect} />
    </div>
  );
}
