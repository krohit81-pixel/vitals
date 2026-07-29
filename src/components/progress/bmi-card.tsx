import Link from "next/link";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

const CATEGORIES = [
  { max: 18.5, label: "Underweight", color: "#3B82F6" },
  { max: 25, label: "Normal", color: "#10B981" },
  { max: 30, label: "Overweight", color: "#F59E0B" },
  { max: Infinity, label: "Obese", color: "#EF4444" },
];

function categorize(bmi: number) {
  return CATEGORIES.find((c) => bmi < c.max) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

/** BMI is a rough screening number, not a diagnosis — worded carefully and
 * never shown without a category so it's read in context, not as a bare
 * score. Hidden gracefully (not a broken "NaN") when height isn't on file
 * yet, since that's the one input that can't be inferred from anywhere else
 * in the app. */
export function BMICard({ bmi }: { bmi: number | null }) {
  if (bmi === null) {
    return (
      <Card className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
          <Activity size={17} className="text-black/40 dark:text-white/40" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink dark:text-cream-100">BMI</p>
          <p className="text-xs text-black/45 dark:text-white/45">
            Add your height in{" "}
            <Link href="/profile/personal-details" className="font-medium text-emerald-600 underline dark:text-emerald-400">
              Personal details
            </Link>{" "}
            to see this.
          </p>
        </div>
      </Card>
    );
  }

  const category = categorize(bmi);

  return (
    <Card className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${category.color}22` }}
      >
        <Activity size={17} style={{ color: category.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink dark:text-cream-100">BMI</p>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${category.color}1F`, color: category.color }}
          >
            {category.label}
          </span>
        </div>
        <p className="font-display text-2xl font-bold tabular-nums text-ink dark:text-cream-100">{bmi.toFixed(1)}</p>
      </div>
    </Card>
  );
}
