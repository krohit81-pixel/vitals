import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAIProvider, type HealthInsightsContext } from "@/lib/ai";

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
    <Card className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-emerald-600 dark:text-emerald-400" />
        <p className="text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          Insights
        </p>
      </div>
      {insights.map((insight, i) => (
        <p key={i} className="text-sm leading-relaxed text-black/75 dark:text-white/75">
          {insight}
        </p>
      ))}
    </Card>
  );
}
