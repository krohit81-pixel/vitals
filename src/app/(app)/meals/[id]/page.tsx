import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/shared/local-time";
import { MEAL_TYPE_LABELS, type MealType } from "@/lib/nutrition/meal-type";
import { DeleteMealButton } from "./delete-meal-button";

interface DetectedItem {
  name: string;
  estimatedQuantity?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  confidence?: number;
}

export default async function MealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meal } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!meal) notFound();

  let photoUrl: string | null = null;
  if (meal.meal_image_id) {
    const { data: image } = await supabase
      .from("meal_images")
      .select("storage_path")
      .eq("id", meal.meal_image_id)
      .single();
    if (image?.storage_path) {
      const { data: signed } = await supabase.storage
        .from("meal-photos")
        .createSignedUrl(image.storage_path, 3600);
      photoUrl = signed?.signedUrl ?? null;
    }
  }

  const items = (meal.detected_items ?? []) as DetectedItem[];

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/meals"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              {MEAL_TYPE_LABELS[meal.meal_type as MealType]}
            </p>
            <LocalTime iso={meal.logged_at} className="text-xs text-black/40 dark:text-white/40" />
          </div>
        </div>
        <DeleteMealButton mealId={meal.id} />
      </div>

      {photoUrl && (
        <div className="relative h-56 w-full overflow-hidden rounded-2xl">
          <Image src={photoUrl} alt="Meal photo" fill className="object-cover" />
        </div>
      )}

      {meal.ai_explanation && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
              AI estimate
            </span>
            {meal.confidence !== null && (
              <span
                className={
                  Number(meal.confidence) >= 0.8
                    ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                }
              >
                {Math.round(Number(meal.confidence) * 100)}% confident
              </span>
            )}
          </div>
          <p className="text-sm text-black/70 dark:text-white/70">{meal.ai_explanation}</p>
        </Card>
      )}

      {meal.raw_input && (
        <Card>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            What you entered
          </p>
          <p className="text-sm text-black/70 dark:text-white/70">{meal.raw_input}</p>
        </Card>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-display text-sm font-medium text-black/50 dark:text-white/50">
            Detected items
          </h2>
          {items.map((item, i) => (
            <Card key={i} className="flex items-center justify-between p-3.5">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                {item.estimatedQuantity && (
                  <p className="text-xs text-black/45 dark:text-white/45">{item.estimatedQuantity}</p>
                )}
              </div>
              {item.calories !== undefined && (
                <span className="text-sm font-medium tabular-nums">{Math.round(item.calories)} kcal</span>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card solid className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
        <Stat label="kcal" value={Math.round(Number(meal.calories))} />
        <Stat label="protein" value={`${Math.round(Number(meal.protein_g))}g`} />
        <Stat label="carbs" value={`${Math.round(Number(meal.carbs_g))}g`} />
        <Stat label="fat" value={`${Math.round(Number(meal.fat_g))}g`} />
        <Stat label="fibre" value={`${Math.round(Number(meal.fibre_g))}g`} />
        <Stat label="sugar" value={`${Math.round(Number(meal.sugar_g))}g`} />
      </Card>

      <p className="text-center text-xs text-black/35 dark:text-white/35">
        Sodium: {Math.round(Number(meal.sodium_mg))}mg · Logged via {meal.source}
      </p>
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
