import { Logo } from "@/components/shared/logo";

export default function AppLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-cream dark:bg-graphite">
      <Logo size="lg" />
      <p className="font-display text-lg font-semibold text-ink dark:text-cream-100">Vitals</p>
    </div>
  );
}
