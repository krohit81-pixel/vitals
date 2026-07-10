import { Sparkles, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAIProvider } from "@/lib/ai";

export async function AiFeedback({
  goals,
  actuals,
  proteinConsistencyPct,
  statusColor,
}: {
  goals: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number };
  actuals: { calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number };
  proteinConsistencyPct: number;
  statusColor: string;
}) {
  let feedback: { summary: string; recommendations: string[] };

  try {
    feedback = await getAIProvider().generateCoachFeedback({
      period: "weekly",
      goals,
      actuals,
      proteinConsistencyPct,
    });
  } catch {
    feedback = {
      summary:
        "Your coach couldn't generate fresh feedback right now — everything else on this page is still accurate, this just needs a retry shortly.",
      recommendations: [],
    };
  }

  return (
    <>
      <Card
        className="relative overflow-hidden"
        style={{ boxShadow: `0 8px 32px -8px ${statusColor}33` }}
      >
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
          <p className="text-[15px] leading-relaxed text-ink dark:text-cream-100">{feedback.summary}</p>
        </div>
      </Card>

      {feedback.recommendations.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="font-display text-base font-medium text-ink dark:text-cream-100">
            Suggestions
          </h2>
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
