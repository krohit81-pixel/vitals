"use client";

import { useState, useTransition } from "react";
import { Watch, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { connectHealthAction, disconnectHealthAction } from "./actions";

export function HealthConnection({
  initialConnected,
  lastSyncAt,
}: {
  initialConnected: boolean;
  lastSyncAt: string | null;
}) {
  const [connected, setConnected] = useState(initialConnected);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleConnect = () => {
    startTransition(async () => {
      const result = await connectHealthAction();
      if ("token" in result) {
        setToken(result.token);
        setConnected(true);
      }
    });
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      await disconnectHealthAction();
      setConnected(false);
      setToken(null);
    });
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!connected) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Watch size={18} className="text-black/40 dark:text-white/40" />
          <p className="text-sm font-medium">Not connected</p>
        </div>
        <p className="text-sm text-black/50 dark:text-white/50">
          Generates a personal sync link for the Vitals Shortcut on your iPhone — see setup
          instructions below.
        </p>
        <Button onClick={handleConnect} disabled={pending} className="w-full">
          {pending ? "Connecting…" : "Connect Apple Health"}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Watch size={18} className="text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium">Connected</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
          Active
        </span>
      </div>

      <p className="text-xs text-black/50 dark:text-white/50">
        Last sync: {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "Never yet — run your Shortcut once"}
      </p>

      {token && (
        <div className="space-y-1.5 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
            Your sync token (shown once — paste it into your Shortcut now):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white/70 px-2 py-1.5 text-xs dark:bg-black/20">
              {token}
            </code>
            <button
              onClick={copyToken}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-black/20"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      <a
        href="shortcuts://run-shortcut?name=Vitals%20Sync"
        className="pressable flex items-center justify-center gap-2 rounded-xl bg-black/[0.04] py-2.5 text-sm font-medium dark:bg-white/[0.06]"
      >
        <RefreshCw size={15} /> Sync Now
      </a>

      <button
        onClick={handleDisconnect}
        disabled={pending}
        className="w-full text-center text-sm font-medium text-red-500"
      >
        Disconnect Apple Health
      </button>
    </Card>
  );
}
