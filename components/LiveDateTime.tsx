"use client";
import { useEffect, useState } from "react";

export default function LiveDateTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!now) {
    // Placeholder to avoid hydration mismatch
    return <div className="min-w-[180px] rounded-lg px-3 py-1" />;
  }

  // Format: e.g. Mon, 10 Jun 2024, 14:23:45
  const formatted = now.toLocaleString("en-US", {
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
