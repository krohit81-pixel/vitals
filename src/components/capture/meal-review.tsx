"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { MealAnalysis } from "@/lib/ai/types";
import { MEAL_TYPE_LABELS, type MealType } from "@/lib/nutrition/meal-type";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MealReview({
  analysis,
  mealType,
  onMealTypeChange,
  onClarify,
  onSave,
  refining,
  saving,
}: {
  analysis: MealAnalysis;
  mealType: MealType;
  onMealTypeChange: (type: MealType) => void;
  onClarify: (answers: Array<{ question: string; answer: "yes" | "no" }>) => void;
  onSave: () => void;
  refining: boolean;
  saving: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, "yes" | "no">>({});

  const needsClarification = analysis.overallConfidence < 0.8 && analysis.clarifyingQuestions.length > 0;
  const allAnswered =
    analysis.clarifyingQuestions.length > 0 &&
    analysis.clarifyingQuestions.every((q) => answers[q.id]);

  return (
    <div className="animate-fade-up space-y-5 py-2">
      {/* Meal type selector */}
      <div className="flex gap-2">
        {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((type) => (
          <button
            key={type}
            onClick={() => onMealTypeChange(type)}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs font-medium transition-colors",
              mealType === type
                ? "bg-emerald-500 text-white"
                : "bg-black/[0.04] text-black/60 dark:bg-white/[0.06] dark:text-white/60"
            )}
          >
            {MEAL_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Confidence + explanation */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            AI estimate
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              analysis.overallConfidence >= 0.8
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
            )}
          >
            {Math.round(analysis.overallConfidence * 100)}% confident
          </span>
        </div>
        <p className="text-sm text-black/70 dark:text-white/70">{analysis.explanation}</p>
      </Card>

      {/* Clarification chips */}
      {needsClarification && (
        <Card>
          <p className="mb-3 text-sm font-medium">A couple of quick questions:</p>
          <div className="space-y-3">
            {analysis.clarifyingQuestions.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-black/70 dark:text-white/70">{q.question}</span>
                <div className="flex shrink-0 gap-1.5">
                  {(["yes", "no"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: option }))}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium",
                        answers[q.id] === option
                          ? option === "yes"
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-red-400 bg-red-400 text-white"
                          : "border-black/10 text-black/50 dark:border-white/15 dark:text-white/50"
                      )}
                    >
                      {option === "yes" ? <Check size={14} /> : <X size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            className="mt-4 w-full"
            size="sm"
            disabled={!allAnswered || refining}
            onClick={() =>
              onClarify(
                analysis.clarifyingQuestions.map((q) => ({
                  question: q.question,
                  answer: answers[q.id] as "yes" | "no",
                }))
              )
            }
          >
            {refining ? "Updating estimate…" : "Update estimate"}
          </Button>
        </Card>
      )}

      {/* Detected items */}
      <div className="space-y-2">
        {analysis.items.map((item, i) => (
          <Card key={i} className="flex items-center justify-between p-3.5">
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-black/45 dark:text-white/45">{item.estimatedQuantity}</p>
            </div>
            <span className="text-sm font-medium tabular-nums">{Math.round(item.calories)} kcal</span>
          </Card>
        ))}
      </div>

      {/* Totals */}
      <Card solid className="grid grid-cols-4 gap-2 text-center">
        <Stat label="kcal" value={Math.round(analysis.totals.calories)} />
        <Stat label="protein" value={`${Math.round(analysis.totals.proteinG)}g`} />
        <Stat label="carbs" value={`${Math.round(analysis.totals.carbsG)}g`} />
        <Stat label="fat" value={`${Math.round(analysis.totals.fatG)}g`} />
      </Card>

      <Button size="lg" className="w-full" disabled={saving || needsClarification} onClick={onSave}>
        {saving ? "Saving…" : "Save meal"}
      </Button>
      {needsClarification && (
        <p className="text-center text-xs text-black/40 dark:text-white/40">
          Answer the questions above to unlock saving with a confident estimate.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-display text-base font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-black/45 dark:text-white/45">{label}</p>
    </div>
  );
}
