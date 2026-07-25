"use client";

import { useState, useTransition } from "react";
import { Sparkles, HeartPulse, Footprints, Apple, Scale, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/shared/local-time";
import { LoadingRing } from "@/components/shared/loading-ring";
import { generateHealthInsightsAction } from "./actions";
import type { HealthInsightsContext } from "@/lib/ai";

// Lightweight keyword match to pick a relevant icon/accent per insight —
// purely presentational, doesn't require any change to the AI's output shape.
function topicFor(text: string): { icon: typeof HeartPulse; color: string } {
  const s = text.toLowerCase();
  if (s.includes("heart") || s.includes("bpm") || s.includes("hrv") || s.includes("oxygen")) {
    return { icon: HeartPulse, color: "#EF4444" };
  }
  if (s.includes("step") || s.includes("workout") || s.includes("activ") || s.includes("exercise")) {
    return { icon: Footprints, color: "#F59E0B" };
  }
  if (s.includes("weight") || s.includes("kg") || s.includes("lb")) {
    return { icon: Scale, color: "#3B82F6" };
  }
  if (s.includes("calorie") || s.includes("protein") || s.includes("nutrition") || s.includes("meal")) {
    return { icon: Apple, color: "#10B981" };
  }
  return { icon: Sparkles, color: "#10B981" };
}

interface InsightsState {
  insights: string[];
  createdAt: string;
}

export function HealthInsightsCard({
  context,
  initial,
}: {
  context: HealthInsightsContext;
  initial: InsightsState | null;
}) {
  const [state, setState] = useState<InsightsState | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const saved = await generateHealthInsightsAction(context);
        setState({ insights: (saved.insights ?? []) as string[], createdAt: saved.created_at });
      } catch {
        setError("Couldn't generate insights right now — try again shortly.");
      }
    });
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-emerald-600 dark:text-emerald-400" />
          <p className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            Insights
          </p>
        </div>
        <button
          onClick={generate}
          disabled={pending}
          className="pressable flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-60"
        >
          {pending ? <LoadingRing size={12} className="text-white" /> : <RefreshCw size={12} />}
          {pending ? "Generating…" : state ? "Regenerate" : "Generate"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {state && state.insights.length > 0 ? (
        <>
          <div className="space-y-2.5">
            {state.insights.map((insight, i) => {
              const { icon: Icon, color } = topicFor(insight);
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-black/[0.02] p-3 dark:bg-white/[0.03]">
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <Icon size={12} style={{ color }} />
                  </div>
                  <p className="text-sm leading-relaxed text-black/75 dark:text-white/75">{insight}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-black/35 dark:text-white/35">
            Last generated <LocalDateTime iso={state.createdAt} />
          </p>
        </>
      ) : (
        <p className="text-sm text-black/45 dark:text-white/45">
          Tap generate to get a fresh read on your recent trends.
        </p>
      )}
    </Card>
  );
}
