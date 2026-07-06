"use client";

import { useEffect, useState } from "react";

/**
 * Renders `iso` as a local time-of-day string, e.g. "8:42 AM".
 *
 * Why this needs to be a client component: meal lists are Server Components,
 * and `toLocaleTimeString()` on the server uses the *server's* timezone (Vercel
 * functions run in UTC), not the viewer's — which is exactly the "shows US
 * time" bug. Formatting here means it runs in the visitor's own browser
 * instead, using whatever timezone their device is actually set to.
 *
 * Renders blank until mounted, then fills in — this avoids a hydration
 * mismatch (server and client would otherwise render different text for the
 * same node, which React flags as an error) at the cost of a brief blank
 * flash on first paint.
 */
export function LocalTime({ iso, className }: { iso: string; className?: string }) {
  const [display, setDisplay] = useState<string>("");

  useEffect(() => {
    setDisplay(new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }, [iso]);

  return <span className={className}>{display}</span>;
}
