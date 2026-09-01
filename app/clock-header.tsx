"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const TIME_ZONE = "America/Chicago";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function ClockHeader({
  initialTime,
  middle,
}: {
  initialTime: string;
  middle?: ReactNode;
}) {
  const [now, setNow] = useState(() => new Date(initialTime));

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeLabel = now.toLocaleTimeString("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
  const dateLabel = now.toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const hour = Number(
    now.toLocaleTimeString("en-US", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      hour12: false,
    })
  );

  return (
    <div
      className="rounded-2xl border border-white/[0.1] px-5 py-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      style={{
        background:
          "radial-gradient(120% 160% at 0% 0%, rgba(56,189,248,0.22) 0%, rgba(56,189,248,0.05) 40%, rgba(255,255,255,0.02) 75%), radial-gradient(110% 160% at 100% 100%, rgba(167,139,250,0.22) 0%, transparent 55%)",
      }}
    >
      <div>
        <p className="text-3xl font-semibold text-white tracking-tight drop-shadow-[0_0_22px_rgba(255,255,255,0.35)]">
          {timeLabel}
        </p>
        <p className="text-sm text-white/40 uppercase tracking-wide mt-1">
          {dateLabel}
        </p>
      </div>
      {middle}
      <p className="text-lg text-white/60">{greeting(hour)}, Nicholas</p>
    </div>
  );
}
