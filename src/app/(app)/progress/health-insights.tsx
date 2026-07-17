import { Sparkles, HeartPulse, Footprints, Apple, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAIProvider, type HealthInsightsContext } from "@/lib/ai";

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

export async function HealthInsightsCard({ context }: { context: HealthInsightsContext }) {
  let insights: string[];

  try {
    const result = await getAIProvider().generateHealthInsights(context);
    insights = result.insights;
  } catch {
    insights = [];
  }

  if (insights.length === 0) return null;

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-emerald-600 dark:text-emerald-400" />
        <p className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          Insights
        </p>
      </div>
      <div className="space-y-2.5">
        {insights.map((insight, i) => {
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
    </Card>
  );
}
