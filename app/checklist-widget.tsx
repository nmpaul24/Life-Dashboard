"use client";

import { useState } from "react";
import { Card } from "./card";
import type { ChecklistItem } from "@/lib/checklist";

export default function ChecklistWidget({
  items,
  completedIds,
}: {
  items: ChecklistItem[];
  completedIds: number[];
}) {
  const [completed, setCompleted] = useState(() => new Set(completedIds));

  async function toggle(id: number) {
    const res = await fetch(`/api/checklist/${id}`, { method: "PATCH" });
    const data = await res.json();
    setCompleted((prev) => {
      const next = new Set(prev);
      if (data.completed) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <Card title="Daily Checklist" accentColor="bg-emerald-400" glowRgb="52,211,153">
      {items.length === 0 && (
        <p className="text-sm text-white/30">No checklist items yet.</p>
      )}
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-1.5"
          >
            <input
              type="checkbox"
              checked={completed.has(item.id)}
              onChange={() => toggle(item.id)}
              className="accent-emerald-500 h-3.5 w-3.5"
            />
            <span
              className={`flex-1 text-sm ${
                completed.has(item.id)
                  ? "line-through text-white/30"
                  : "text-white/90"
              }`}
            >
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
