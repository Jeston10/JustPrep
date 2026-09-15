"use client";
import { useSyncExternalStore } from "react";

// Ticks once per second; the server snapshot is null so SSR and hydration match.
// Widget is deleted in P3.5 (GUARDRAILS D3).
const subscribe = (onChange: () => void) => {
  const interval = setInterval(onChange, 1000);
  return () => {
    clearInterval(interval);
  };
};
const getSnapshot = () => Math.floor(Date.now() / 1000);
const getServerSnapshot = () => null;

export default function LiveDateTime() {
  const seconds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (seconds === null) {
    // Placeholder to avoid hydration mismatch
    return <div className="min-w-[180px] rounded-lg px-3 py-1" />;
  }

  // Format: e.g. Mon, 10 Jun 2024, 14:23:45
  const formatted = new Date(seconds * 1000).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex min-w-[180px] items-center justify-center rounded-lg border border-purple-700 bg-[#181824]/80 px-3 py-1 font-mono text-xs text-purple-200 shadow">
      {formatted}
    </div>
  );
}
