import { NavShell } from "@/components/navigation/nav-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <NavShell>{children}</NavShell>;
}
