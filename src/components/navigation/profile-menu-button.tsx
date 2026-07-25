"use client";

import Link, { useLinkStatus } from "next/link";
import { Menu } from "lucide-react";
import { LoadingRing } from "@/components/shared/loading-ring";
import { cn } from "@/lib/utils";

function MenuIcon() {
  const { pending } = useLinkStatus();
  return pending ? <LoadingRing size={16} className="text-current" /> : <Menu size={18} />;
}

export function ProfileMenuButton({ variant = "default" }: { variant?: "default" | "banner" }) {
  return (
    <Link
      href="/profile"
      aria-label="Profile and settings"
      className={cn(
        "pressable flex h-9 w-9 items-center justify-center rounded-full md:hidden",
        variant === "banner"
          ? "bg-white/80 text-ink shadow-soft backdrop-blur-sm hover:bg-white"
          : "bg-black/[0.04] text-black/60 dark:bg-white/[0.06] dark:text-white/60"
      )}
    >
      <MenuIcon />
    </Link>
  );
}
