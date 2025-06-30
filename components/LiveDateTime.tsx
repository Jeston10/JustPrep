"use client";
import { useEffect, useState } from "react";

export default function LiveDateTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    // Placeholder to avoid hydration mismatch
    return <div className="px-3 py-1 rounded-lg min-w-[180px]" />;
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
    <div className="px-3 py-1 rounded-lg bg-[#181824]/80 border border-purple-700 text-xs font-mono text-purple-200 shadow flex items-center min-w-[180px] justify-center">
      {formatted}
    </div>
  );
} 