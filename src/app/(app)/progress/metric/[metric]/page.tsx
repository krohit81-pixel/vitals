import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { RangeSelector } from "@/components/progress/range-selector";
import { MetricDetailChart } from "@/components/progress/metric-detail-chart";
import { getDailyMetricSeries, summarizeSeries } from "@/lib/nutrition/get-health-metrics";
import { metricMeta, convertMetricValue } from "@/lib/nutrition/health-metric-meta";
import { addDays, rangeToDays, RANGE_LABELS, type RangeOption } from "@/lib/nutrition/date";

export default async function MetricDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ metric: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { metric } = await params;
  const sp = await searchParams;
  const range = (["7d", "30d", "90d", "1y"].includes(sp.range ?? "") ? sp.range : "7d") as RangeOption;
  const days = rangeToDays(range);

  const today = new Date().toISOString().slice(0, 10);
  const start = addDays(today, -(days - 1));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const series = await getDailyMetricSeries(supabase, user!.id, metric, start, today);
  const meta = metricMeta(metric);
  const converted = series.map((p) => ({ date: p.date, value: convertMetricValue(metric, p.value) }));
  const stats = summarizeSeries(converted);

  const round = (v: number) => (meta.decimals === 0 ? Math.round(v) : Math.round(v * 10) / 10);

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/progress" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">{meta.label}</h1>
          <p className="text-xs text-black/40 dark:text-white/40">
            {RANGE_LABELS[range]} · All Sources
          </p>
        </div>
      </div>

      <RangeSelector range={range} />

      <Card>
        <MetricDetailChart data={converted} color={meta.color} unit={meta.unit} />
      </Card>

      <Card solid className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Average" value={round(stats.average)} unit={meta.unit} />
        <Stat label="Min" value={round(stats.min)} unit={meta.unit} />
        <Stat label="Max" value={round(stats.max)} unit={meta.unit} />
      </Card>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <p className="text-xs text-black/40 dark:text-white/40">{label}</p>
      <p className="font-display text-xl font-bold tabular-nums text-ink dark:text-cream-100">{value.toLocaleString()}</p>
      <p className="text-[11px] text-black/35 dark:text-white/35">{unit}</p>
    </div>
  );
}
