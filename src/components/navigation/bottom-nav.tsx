"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TAB_ITEMS } from "./nav-items";
import { LoadingRing } from "@/components/shared/loading-ring";
import { cn } from "@/lib/utils";

/** Must render as a descendant of <Link> — useLinkStatus reflects whether
 * *this specific* link's navigation is in flight, so a tab switch always
 * shows a visible spinner instead of nothing happening until the new
 * screen appears. */
function TabIcon({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
  const { pending } = useLinkStatus();
  const colorClass = active ? "text-emerald-600 dark:text-emerald-400" : "text-black/40 dark:text-white/40";

  if (pending) return <LoadingRing size={20} className={colorClass} />;
  return <Icon size={22} strokeWidth={active ? 2.4 : 2} className={cn("transition-colors", colorClass)} />;
}

export function BottomNav({ onCapture }: { onCapture: () => void }) {
  const pathname = usePathname();
  const left = TAB_ITEMS.slice(0, 2);
  const right = TAB_ITEMS.slice(2);

  const renderItem = (item: (typeof TAB_ITEMS)[number]) => {
    const active = pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className="relative flex flex-1 flex-col items-center gap-1 py-2"
      >
        {active && (
          <motion.div
            layoutId="bottom-nav-active"
            className="absolute -top-0.5 h-1 w-6 rounded-full bg-emerald-500"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <TabIcon icon={item.icon} active={active} />
        <span
          className={cn(
            "text-[10px] font-medium",
            active ? "text-emerald-600 dark:text-emerald-400" : "text-black/40 dark:text-white/40"
          )}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg dark:border-white/[0.06] dark:bg-graphite/80 md:hidden print:hidden">
      <div className="relative mx-auto flex max-w-md items-center px-2">
        {left.map(renderItem)}

        <div className="flex w-16 justify-center">
          <button
            onClick={onCapture}
            aria-label="Log a meal"
            className="pressable -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-glow"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {right.map(renderItem)}
      </div>
    </nav>
  );
}
