"use client";

import { useState } from "react";
import Modal from "./modal";

export default function AddEventButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt) return;
    setSubmitting(true);

    await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        starts_at: new Date(startsAt).toISOString(),
      }),
    });

    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors"
      >
        + Add
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add event">
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
            disabled={submitting}
            className="bg-fuchsia-500 hover:bg-fuchsia-400 text-white rounded-xl px-4 py-2 font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </form>
      </Modal>
    </>
  );
}
