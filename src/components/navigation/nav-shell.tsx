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

    if (label === "Log Workout") {
      router.push("/workouts/new");
      return;
    }

    const modeByLabel: Record<string, string> = {
      "Take Photo": "photo",
      "Upload Photo": "upload",
      "Manual Entry": "manual",
      "Voice Entry": "voice",
    };
    const mode = modeByLabel[label];
    if (mode) router.push(`/meals/new?mode=${mode}`);
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
