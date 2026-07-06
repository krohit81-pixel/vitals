import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthConnection } from "./health-connection";

export default async function HealthSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("settings")
    .select("health_connected, health_last_sync_at")
    .eq("user_id", user!.id)
    .single();

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Apple Health</h1>
      </div>

      <p className="text-sm text-black/50 dark:text-white/50">
        Apple&apos;s HealthKit only works inside a native iPhone app — a website can&apos;t read it
        directly, even installed to your home screen. Vitals bridges this with a personal sync
        link that the iOS Shortcuts app can call, using its built-in Health access.
      </p>

      <HealthConnection
        initialConnected={settings?.health_connected ?? false}
        lastSyncAt={settings?.health_last_sync_at ?? null}
      />

      <Card>
        <CardHeader>
          <CardTitle>One-time setup on your iPhone</CardTitle>
        </CardHeader>
        <ol className="list-inside list-decimal space-y-2 text-sm text-black/70 dark:text-white/70">
          <li>Open the <strong>Shortcuts</strong> app → Automation tab → + → Create Personal Automation.</li>
          <li>Trigger: <strong>Apple Watch Workout</strong> → Any Workout → When Workout: <strong>End</strong>.</li>
          <li>Add action <strong>Get Workouts</strong> (Any type, Today).</li>
          <li>
            Add action <strong>Get Contents of URL</strong> → set to your sync endpoint (below),
            Method <strong>POST</strong>, Headers: <code>Authorization: Bearer &lt;your token&gt;</code>,
            Request Body (JSON): a <code>workouts</code> array built from the workout&apos;s type, date,
            start time, duration, calories, and its Health UUID as <code>healthWorkoutId</code>.
          </li>
          <li>Name the shortcut <strong>&quot;Vitals Sync&quot;</strong> exactly — that&apos;s what the Sync Now button opens.</li>
        </ol>
        <p className="mt-3 rounded-lg bg-black/[0.03] p-2.5 text-xs text-black/50 dark:bg-white/[0.05] dark:text-white/50">
          Endpoint: <code>{`${process.env.NEXT_PUBLIC_APP_URL ?? "https://your-app-domain.com"}/api/health/sync`}</code>
        </p>
      </Card>
    </div>
  );
}
