"use client";

import { useState } from "react";
import Modal from "./modal";

export type Event = {
  id: string;
  title: string;
  startsAt: string;
};

const TIME_ZONE = "America/Chicago";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 24 * 60 * 60 * 1000;

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
  const [referenceDate] = useState(() => new Date(today));
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const weekDays = getWeekDays(referenceDate);
  const todayKey = dateKey(referenceDate);

  const eventsByDay = new Map<string, Event[]>();
  for (const event of initialEvents) {
    const key = dateKey(new Date(event.startsAt));
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }
  for (const list of eventsByDay.values()) {
    list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async function deleteEvent(id: string) {
    setDeletingId(id);
    await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  const selectedEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];
  const selectedLabel = selectedDay
    ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString("en-US", {
        timeZone: TIME_ZONE,
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <>
      <div className="grid grid-cols-7 gap-1.5">
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
              className={`min-h-[220px] flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 border transition-colors ${
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
