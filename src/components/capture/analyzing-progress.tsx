"use client";

import { useEffect, useState } from "react";

const DEFAULT_STAGES = [
  "Uploading…",
  "Identifying foods…",
  "Estimating nutrition…",
  "Double-checking portions…",
];

export function AnalyzingProgress({ stages = DEFAULT_STAGES }: { stages?: string[] }) {
  const [progress, setProgress] = useState(6);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    // Eases toward ~92% and stops — there's no real progress signal from a
    // single AI call, so this is a deliberately honest approximation: it
    // never claims to reach 100% on its own, only once the real result comes
    // back and this component unmounts.
    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev >= 92 ? 92 : prev + (92 - prev) * 0.06));
    }, 120);

    const stageTimer = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, stages.length - 1));
    }, 1800);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stageTimer);
    };
  }, [stages.length]);

  const size = 96;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            className="fill-none stroke-black/[0.06] dark:stroke-white/[0.08]"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            className="fill-none stroke-emerald-500 transition-[stroke-dashoffset] duration-150 ease-linear"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
          />
        </svg>
        <span className="absolute font-display text-lg font-semibold tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
      <p className="text-sm text-black/50 dark:text-white/50">{stages[stageIndex]}</p>
    </div>
  );
}
