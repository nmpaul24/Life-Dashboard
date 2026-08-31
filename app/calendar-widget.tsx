"use client";

import { useState } from "react";
import { Card } from "./card";

export type Event = {
  id: number;
  title: string;
  starts_at: string;
  created_at: string;
};

export default function CalendarWidget({
  initialEvents,
}: {
  initialEvents: Event[];
}) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [now] = useState(() => Date.now());

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
  }

  async function deleteEvent(id: number) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <Card title="Calendar" accentColor="bg-fuchsia-400">
      <form onSubmit={addEvent} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
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

      <div className="flex flex-col gap-2">
        {events.length === 0 && (
          <p className="text-sm text-white/30">No events yet.</p>
        )}
        <ul className="flex flex-col gap-2">
          {events.map((event) => {
            const isPast = new Date(event.starts_at).getTime() < now;
            return (
              <li
                key={event.id}
                className={`flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 ${
                  isPast ? "opacity-40" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="text-white/90">{event.title}</p>
                  <p className="text-xs text-white/40">
                    {new Date(event.starts_at).toLocaleString("en-US", {
                      timeZone: "America/Chicago",
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
