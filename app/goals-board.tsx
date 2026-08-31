"use client";

import { useState } from "react";
import { Card } from "./card";
import Modal from "./modal";

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
  const [addOpen, setAddOpen] = useState(false);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, type: "daily" }),
    });
    const goal = await res.json();
    setGoals((prev) => [goal, ...prev]);
    setText("");
    setAddOpen(false);
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

  return (
    <Card
      title="To-Do List"
      accentColor="bg-violet-400"
      action={
        <button
          onClick={() => setAddOpen(true)}
          className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors"
        >
          + Add
        </button>
      }
    >
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
              onChange={() => toggleGoal(goal.id)}
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
              onClick={() => deleteGoal(goal.id)}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add to-do">
        <form onSubmit={addGoal} className="flex flex-col gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you need to do?"
            autoFocus
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
          />
          <button
            type="submit"
            className="bg-violet-500 hover:bg-violet-400 text-white rounded-xl px-4 py-2 font-medium transition-colors"
          >
            Add
          </button>
        </form>
      </Modal>
    </Card>
  );
}
