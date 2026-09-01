"use client";

import { useState } from "react";
import { Card } from "./card";
import type { ChecklistItem } from "@/lib/checklist";

export default function ChecklistWidget({
  items,
  completedIds,
  weekPercent,
}: {
  items: ChecklistItem[];
  completedIds: number[];
  weekPercent: number;
}) {
  const [completed, setCompleted] = useState(() => new Set(completedIds));
  const [percent, setPercent] = useState(weekPercent);

  async function toggle(id: number) {
    const res = await fetch(`/api/checklist/${id}`, { method: "PATCH" });
    const data = await res.json();
    setCompleted((prev) => {
      const next = new Set(prev);
      if (data.completed) next.add(id);
      else next.delete(id);
      return next;
    });
    setPercent(data.weekPercent);
  }

  return (
    <Card
      title="Daily Checklist"
      accentColor="bg-emerald-400"
      glowRgb="52,211,153"
      action={<span className="text-xs text-white/40">{percent}% this week</span>}
    >
      {items.length === 0 && (
        <p className="text-sm text-white/30">No checklist items yet.</p>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5"
          >
            <input
              type="checkbox"
              checked={completed.has(item.id)}
              onChange={() => toggle(item.id)}
              className="accent-emerald-500 h-4 w-4"
            />
            <span
              className={`flex-1 ${
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
