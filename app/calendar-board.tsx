"use client";

import { useRef, useState } from "react";
import Modal from "./modal";

export type Event = {
  id: string;
  title: string;
  startsAt: string;
};

const TIME_ZONE = "America/Chicago";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 24 * 60 * 60 * 1000;
const WHEEL_THRESHOLD = 250;
const WHEEL_COOLDOWN_MS = 500;

function dateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function weekdayIndex(date: Date): number {
  const name = date.toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
  });
  return DAY_NAMES.indexOf(name);
}

function getWeekDays(referenceDate: Date): Date[] {
  const idx = weekdayIndex(referenceDate);
  const sunday = new Date(referenceDate.getTime() - idx * DAY_MS);
  return Array.from({ length: 7 }, (_, i) => new Date(sunday.getTime() + i * DAY_MS));
}

function formatEventTime(isoString: string): string {
  const formatted = new Date(isoString).toLocaleTimeString("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
  return formatted.replace(":00 ", " ");
}

export default function CalendarBoard({
  initialEvents,
  today,
}: {
  initialEvents: Event[];
  today: string;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [actualToday] = useState(() => new Date(today));
  const [weekOffset, setWeekOffset] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventsByDay, setEventsByDay] = useState(() => {
    const map = new Map<string, Event[]>();
    for (const event of initialEvents) {
      const key = dateKey(new Date(event.startsAt));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }
    return map;
  });
  const loadedWeeks = useRef(new Set<number>([0]));
  const wheelAccum = useRef(0);
  const lastWheelTrigger = useRef(0);

  const referenceDate = new Date(actualToday.getTime() + weekOffset * 7 * DAY_MS);
  const weekDays = getWeekDays(referenceDate);
  const todayKey = dateKey(actualToday);

  async function goToWeek(offset: number) {
    setWeekOffset(offset);
    if (loadedWeeks.current.has(offset)) return;

    const reference = new Date(actualToday.getTime() + offset * 7 * DAY_MS);
    const days = getWeekDays(reference);
    const start = new Date(days[0].getTime() - DAY_MS).toISOString();
    const end = new Date(days[6].getTime() + DAY_MS).toISOString();

    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
      const fetched: Event[] = res.ok ? await res.json() : [];
      setEventsByDay((prev) => {
        const next = new Map(prev);
        const byDay = new Map<string, Event[]>();
        for (const event of fetched) {
          const key = dateKey(new Date(event.startsAt));
          const list = byDay.get(key) ?? [];
          list.push(event);
          byDay.set(key, list);
        }
        for (const day of days) {
          const key = dateKey(day);
          const list = byDay.get(key) ?? [];
          list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
          next.set(key, list);
        }
        return next;
      });
      loadedWeeks.current.add(offset);
    } finally {
      setLoading(false);
    }
  }

  function handleWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    const now = Date.now();
    if (now - lastWheelTrigger.current < WHEEL_COOLDOWN_MS) return;

    wheelAccum.current += e.deltaX;
    if (Math.abs(wheelAccum.current) > WHEEL_THRESHOLD) {
      const direction = wheelAccum.current > 0 ? 1 : -1;
      wheelAccum.current = 0;
      lastWheelTrigger.current = now;
      goToWeek(weekOffset + direction);
    }
  }

  const weekLabel = `${weekDays[0].toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
  })} - ${weekDays[6].toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
  })}`;

  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];
  const selectedLabel = selectedDay
    ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString("en-US", {
        timeZone: TIME_ZONE,
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  async function deleteEvent(id: string) {
    setDeletingId(id);
    await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 -mt-1">
        <button
          onClick={() => goToWeek(weekOffset - 1)}
          aria-label="Previous week"
          className="text-white/40 hover:text-white/80 transition-colors px-1"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <p className="text-xs text-white/40">{weekLabel}</p>
          {weekOffset !== 0 && (
            <button
              onClick={() => goToWeek(0)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => goToWeek(weekOffset + 1)}
          aria-label="Next week"
          className="text-white/40 hover:text-white/80 transition-colors px-1"
        >
          ›
        </button>
      </div>

      <div
        onWheel={handleWheel}
        className={`grid grid-cols-7 gap-1.5 transition-opacity ${loading ? "opacity-50" : ""}`}
      >
        {weekDays.map((day) => {
          const key = dateKey(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = key === todayKey;
          const visibleEvents = dayEvents.slice(0, 2);
          const extraCount = dayEvents.length - visibleEvents.length;
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(key)}
              className={`min-h-[140px] flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 border transition-colors ${
                isToday
                  ? "bg-fuchsia-400/10 border-fuchsia-400/30"
                  : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
              }`}
            >
              <p className="text-[10px] text-white/40 uppercase">
                {day.toLocaleDateString("en-US", {
                  timeZone: TIME_ZONE,
                  weekday: "short",
                })}
              </p>
              <p className="text-base font-semibold text-white">
                {day.toLocaleDateString("en-US", {
                  timeZone: TIME_ZONE,
                  day: "numeric",
                })}
              </p>
              <div className="flex flex-col gap-1 w-full">
                {visibleEvents.map((event) => (
                  <div
                    key={event.id}
                    className="text-left text-[10px] leading-tight bg-fuchsia-400/15 rounded px-1 py-1 w-full"
                  >
                    <p className="font-semibold text-fuchsia-300 whitespace-nowrap">
                      {formatEventTime(event.startsAt)}
                    </p>
                    <p className="text-fuchsia-100 whitespace-normal break-words">
                      {event.title}
                    </p>
                  </div>
                ))}
                {extraCount > 0 && (
                  <p className="text-[10px] text-white/40">
                    +{extraCount} more
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Modal
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedLabel}
      >
        <div className="flex flex-col gap-2">
          {selectedEvents.length === 0 && (
            <p className="text-sm text-white/30">No events on this day.</p>
          )}
          <ul className="flex flex-col gap-2">
            {selectedEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5"
              >
                <div className="flex-1">
                  <p className="text-xs text-fuchsia-300 font-medium">
                    {formatEventTime(event.startsAt)}
                  </p>
                  <p className="text-white/90">{event.title}</p>
                </div>
                <button
                  onClick={() => deleteEvent(event.id)}
                  disabled={deletingId === event.id}
                  aria-label="Delete"
                  className="text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-40 shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
