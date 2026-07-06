"use client";

import { useEffect, useState } from "react";

function greetingForHour(hour: number): string {
  if (hour < 5) return "Good night,";
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  if (hour < 21) return "Good evening,";
  return "Good night,";
}

/**
 * Renders "Good morning," / "Good afternoon," etc. Same reasoning as
 * LocalTime: this is a Server Component tree, and computing the hour on the
 * server would use the server's UTC clock, not the viewer's — same class of
 * bug as meal times showing in the wrong timezone. Rendering here means it
 * runs in the visitor's own browser.
 */
export function GreetingText() {
  const [greeting, setGreeting] = useState("Hello,");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return <>{greeting}</>;
}
