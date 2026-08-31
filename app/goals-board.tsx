"use client";

import { useState } from "react";

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
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Goals</h2>

      <form onSubmit={addGoal} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a goal..."
          className="flex-1 border rounded px-3 py-2"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "daily" | "long_term")}
          className="border rounded px-3 py-2"
        >
          <option value="daily">Daily</option>
          <option value="long_term">Long-term</option>
        </select>
        <button type="submit" className="bg-black text-white rounded px-4 py-2">
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
    </section>
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
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      {goals.length === 0 && (
        <p className="text-sm text-gray-400">No goals yet.</p>
      )}
      <ul className="flex flex-col gap-1">
        {goals.map((goal) => (
          <li
            key={goal.id}
            className="flex items-center gap-2 border rounded px-3 py-2"
          >
            <input
              type="checkbox"
              checked={goal.completed}
              onChange={() => onToggle(goal.id)}
            />
            <span
              className={`flex-1 ${
                goal.completed ? "line-through text-gray-400" : ""
              }`}
            >
              {goal.text}
            </span>
            <button
              onClick={() => onDelete(goal.id)}
              className="text-sm text-red-500"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
