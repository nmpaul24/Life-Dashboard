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
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-3xl font-semibold text-white tracking-tight">
          {timeLabel}
        </p>
        <p className="text-sm text-white/40 uppercase tracking-wide mt-1">
          {dateLabel}
        </p>
      </div>
      {middle}
      <p className="text-lg text-white/60">{greeting(hour)}</p>
    </div>
  );
}
