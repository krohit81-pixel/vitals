import { APP_VERSION } from "@/lib/version";

export function AppFooter() {
  return (
    <footer className="mt-10 pb-6 text-center">
      <p className="text-xs font-medium text-black/40 dark:text-white/40">
        Vitals <span className="text-[9px]">v:{APP_VERSION}</span> - Created by Rohit Kohli
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-emerald-600/70 dark:text-emerald-400/70">
        Eat right • Move more • Live better
      </p>
    </footer>
  );
}
