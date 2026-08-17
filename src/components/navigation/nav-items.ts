import { Home, UtensilsCrossed, TrendingUp, Sparkles, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/coach", label: "AI Coach", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
];

// Bottom nav shows 4 tabs (2 either side of the floating capture button).
// Profile moves into HeaderMenu's dropdown (the header hamburger) on mobile
// instead — see header-menu.tsx — and stays in the sidebar's full list on
// desktop, where HeaderMenu's own Profile row hides itself accordingly.
export const TAB_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => item.href !== "/profile");
