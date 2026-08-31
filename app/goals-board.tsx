"use client";

import { useState } from "react";
import { Card } from "./card";

export type Goal = {
  id: number;
  text: string;
  type: "daily" | "long_term";
  completed: boolean;
  created_at: string;
};

export default function GoalsBoard({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [text, setText] = useState("");
  const [type, setType] = useState<"daily" | "long_term">("daily");

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, type }),
    });
    const goal = await res.json();
    setGoals((prev) => [goal, ...prev]);
    setText("");
  }

  async function toggleGoal(id: number) {
    const res = await fetch(`/api/goals/${id}`, { method: "PATCH" });
    const updated = await res.json();
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  }

  async function deleteGoal(id: number) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const dailyGoals = goals.filter((g) => g.type === "daily");
  const longTermGoals = goals.filter((g) => g.type === "long_term");

  return (
    <Card title="Goals" accentColor="bg-violet-400">
      <form onSubmit={addGoal} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a goal..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "daily" | "long_term")}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/25"
        >
          <option value="daily" className="bg-[#0a0a0f]">
            Daily
          </option>
          <option value="long_term" className="bg-[#0a0a0f]">
            Long-term
          </option>
        </select>
        <button
          type="submit"
          className="bg-violet-500 hover:bg-violet-400 text-white rounded-xl px-4 py-2 font-medium transition-colors"
        >
          Add
        </button>
      </form>

      <div className="grid gap-6 sm:grid-cols-2">
        <GoalList
          title="Daily"
          goals={dailyGoals}
          onToggle={toggleGoal}
          onDelete={deleteGoal}
        />
        <GoalList
          title="Long-term"
          goals={longTermGoals}
          onToggle={toggleGoal}
          onDelete={deleteGoal}
        />
      </div>
    </Card>
  );
}

function GoalList({
  title,
  goals,
  onToggle,
  onDelete,
}: {
  title: string;
  goals: Goal[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-white/40 uppercase tracking-wide">
        {title}
      </h3>
      {goals.length === 0 && (
        <p className="text-sm text-white/30">No goals yet.</p>
      )}
      <ul className="flex flex-col gap-2">
        {goals.map((goal) => (
          <li
            key={goal.id}
            className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5"
          >
            <input
              type="checkbox"
              checked={goal.completed}
              onChange={() => onToggle(goal.id)}
              className="accent-violet-500 h-4 w-4"
            />
            <span
              className={`flex-1 ${
                goal.completed ? "line-through text-white/30" : "text-white/90"
              }`}
            >
              {goal.text}
            </span>
            <button
              onClick={() => onDelete(goal.id)}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
