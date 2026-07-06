import Link from "next/link";
import { Menu } from "lucide-react";

export function ProfileMenuButton() {
  return (
    <Link
      href="/profile"
      aria-label="Profile and settings"
      className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-black/60 dark:bg-white/[0.06] dark:text-white/60 md:hidden"
    >
      <Menu size={19} />
    </Link>
  );
}
