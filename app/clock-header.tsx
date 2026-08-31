"use client";

import { useEffect, useState } from "react";

const TIME_ZONE = "America/Chicago";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function ClockHeader({ initialTime }: { initialTime: string }) {
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
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-3xl font-semibold text-white tracking-tight">
          {timeLabel}
        </p>
        <p className="text-sm text-white/40 uppercase tracking-wide mt-1">
          {dateLabel}
        </p>
      </div>
      <p className="text-lg text-white/60">{greeting(hour)}</p>
    </div>
  );
}
