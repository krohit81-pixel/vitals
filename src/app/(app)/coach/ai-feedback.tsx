"use client";

import { useState, useTransition } from "react";
import { Sparkles, Lightbulb, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LocalDateTime } from "@/components/shared/local-time";
import { LoadingRing } from "@/components/shared/loading-ring";
import { generateCoachFeedbackAction } from "./actions";
import type { CoachPromptContext } from "@/lib/ai/types";

interface FeedbackState {
  summary: string;
  recommendations: string[];
  createdAt: string;
}

export function AiFeedback({
  context,
  initial,
  statusColor,
}: {
  context: CoachPromptContext;
  initial: FeedbackState | null;
  statusColor: string;
}) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const saved = await generateCoachFeedbackAction(context);
        setFeedback({
          summary: saved.summary,
          recommendations: (saved.recommendations ?? []) as string[],
          createdAt: saved.created_at,
        });
      } catch {
        setError("Couldn't generate feedback right now — try again shortly.");
      }
    });
  };

  return (
    <>
      <Card className="relative overflow-hidden" style={{ boxShadow: `0 8px 32px -8px ${statusColor}33` }}>
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.15] blur-2xl"
          style={{ backgroundColor: statusColor }}
        />
        <div className="relative flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${statusColor}22` }}
          >
            <Sparkles size={17} style={{ color: statusColor }} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {feedback ? (
              <p className="text-[15px] leading-relaxed text-ink dark:text-cream-100">{feedback.summary}</p>
            ) : (
              <p className="text-[15px] leading-relaxed text-black/50 dark:text-white/50">
                Get your coach&apos;s read on this week whenever you&apos;re ready — tap generate below.
              </p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
          <span className="text-xs text-black/40 dark:text-white/40">
            {feedback ? (
              <>
                Last generated <LocalDateTime iso={feedback.createdAt} />
              </>
            ) : (
              "No feedback generated yet"
            )}
          </span>
          <button
            onClick={generate}
            disabled={pending}
            className="pressable flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: statusColor }}
          >
            {pending ? <LoadingRing size={13} className="text-white" /> : <RefreshCw size={13} />}
            {pending ? "Generating…" : feedback ? "Regenerate" : "Generate"}
          </button>
        </div>
      </Card>

      {feedback && feedback.recommendations.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="font-display text-base font-medium text-ink dark:text-cream-100">Suggestions</h2>
          {feedback.recommendations.map((rec, i) => (
            <Card key={i} className="flex items-start gap-3 p-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                <Lightbulb size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm leading-relaxed text-black/75 dark:text-white/75">{rec}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
