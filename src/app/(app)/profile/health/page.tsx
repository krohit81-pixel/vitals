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
          <li>Open <strong>Shortcuts</strong> → Automation tab → + → Create Personal Automation.</li>
          <li>Trigger: <strong>Apple Watch Workout</strong> → Any Workout → When Workout: <strong>End</strong>.</li>
          <li>
            Add action <strong>Find Health Samples</strong> → Type: <strong>Workouts</strong> →
            Start Date: <strong>Today</strong>.
          </li>
          <li>
            Add action <strong>Get Contents of URL</strong> → your sync endpoint (below), Method{" "}
            <strong>POST</strong>, Headers: <code>Authorization: Bearer &lt;your token&gt;</code>,
            Request Body → JSON → set the <code>workouts</code> field directly to the{" "}
            <strong>Find Health Samples</strong> result from step 3 — no manual field-mapping
            needed, just drop the whole result in.
          </li>
          <li>
            Optional but recommended: add <strong>Show Result</strong> at the end, showing the
            output of step 4 — lets you see <code>{"{ imported, skipped }"}</code> right after
            each sync instead of only checking the app.
          </li>
          <li>Name the shortcut <strong>&quot;Vitals Sync&quot;</strong> exactly — that&apos;s what Sync Now opens.</li>
        </ol>
        <p className="mt-3 rounded-lg bg-black/[0.03] p-2.5 text-xs text-black/50 dark:bg-white/[0.05] dark:text-white/50">
          Endpoint: <code>{`${process.env.NEXT_PUBLIC_APP_URL ?? "https://your-app-domain.com"}/api/health/sync`}</code>
        </p>
        <p className="mt-3 text-xs text-black/40 dark:text-white/40">
          Apple doesn&apos;t document the exact field names inside a Health sample dictionary, so
          the sync endpoint accepts several common variants and skips (rather than fails on)
          anything it can&apos;t confidently read. If <code>skipped</code> stays above 0 on your
          first real sync, that&apos;s worth flagging back — it means your device is labeling a
          field differently than expected, not that something is broken.
        </p>
      </Card>
    </div>
  );
}
