"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export function Sidebar({ onCapture }: { onCapture: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-black/[0.06] bg-white/60 px-4 py-6 backdrop-blur-lg dark:border-white/[0.06] dark:bg-graphite/60 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Logo size="sm" />
        <span className="font-display text-lg font-semibold">Vitals</span>
      </div>

      <button
        onClick={onCapture}
        className="pressable mb-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-glow"
      >
        <Plus size={18} /> Log a meal
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "text-black/60 hover:bg-black/[0.04] dark:text-white/60 dark:hover:bg-white/[0.06]"
              )}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
