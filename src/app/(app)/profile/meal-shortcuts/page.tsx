import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ShortcutManager } from "@/components/profile/shortcut-manager";

export default async function MealShortcutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shortcuts } = await supabase
    .from("meal_shortcuts")
    .select("id, label")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  return (
    <div className="animate-fade-up space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Meal Shortcuts</h1>
          <p className="text-xs text-black/40 dark:text-white/40">Quick-add chips on Manual Entry</p>
        </div>
      </div>

      <ShortcutManager initialShortcuts={shortcuts ?? []} />
    </div>
  );
}
