"use client";

import { useState } from "react";
import { Card } from "./card";
import Modal from "./modal";

export type Event = {
  id: number;
  title: string;
  starts_at: string;
  created_at: string;
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

export default function CalendarWidget({
  initialEvents,
  today,
}: {
  initialEvents: Event[];
  today: string;
}) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [referenceDate] = useState(() => new Date(today));

  const weekDays = getWeekDays(referenceDate);
  const todayKey = dateKey(referenceDate);

  const eventsByDay = new Map<string, Event[]>();
  for (const event of events) {
    const key = dateKey(new Date(event.starts_at));
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }
  for (const list of eventsByDay.values()) {
    list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt) return;

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        starts_at: new Date(startsAt).toISOString(),
      }),
    });
    const event = await res.json();
    setEvents((prev) =>
      [...prev, event].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    );
    setTitle("");
    setStartsAt("");
    setAddOpen(false);
  }

  async function deleteEvent(id: number) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
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
    <Card
      title="Calendar"
      accentColor="bg-fuchsia-400"
      glowRgb="232,121,249"
      action={
        <button
          onClick={() => setAddOpen(true)}
          className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors"
        >
          + Add
        </button>
      }
    >
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
                      {formatEventTime(event.starts_at)}
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add event">
        <form onSubmit={addEvent} className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title..."
            autoFocus
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
          />
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/25"
          />
          <button
            type="submit"
            className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white rounded-xl px-4 py-2 font-medium transition-colors"
          >
            Add
          </button>
        </form>
      </Modal>

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
                    {formatEventTime(event.starts_at)}
                  </p>
                  <p className="text-white/90">{event.title}</p>
                </div>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </Card>
  );
}
