import { sql } from "./db";

const TIME_ZONE = "America/Chicago";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 24 * 60 * 60 * 1000;

export type ChecklistItem = { id: number; text: string };

export function todayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function weekdayIndex(dayKey: string): number {
  const name = new Date(`${dayKey}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
  });
  return DAY_NAMES.indexOf(name);
}

export function weekStartKey(today: string): string {
  const idx = weekdayIndex(today);
  const date = new Date(new Date(`${today}T12:00:00Z`).getTime() - idx * DAY_MS);
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  return (await sql`
    SELECT id, text FROM checklist_items ORDER BY sort_order
  `) as unknown as ChecklistItem[];
}

export async function getCompletedIdsForDay(day: string): Promise<number[]> {
  const rows = (await sql`
    SELECT item_id FROM checklist_completions WHERE day = ${day}
  `) as unknown as { item_id: number }[];
  return rows.map((r) => r.item_id);
}

export async function getWeekPercent(
  itemCount: number,
  weekStart: string,
  today: string
): Promise<number> {
  if (itemCount === 0) return 0;

  const rows = (await sql`
    SELECT COUNT(*)::int AS count FROM checklist_completions
    WHERE day BETWEEN ${weekStart} AND ${today}
  `) as unknown as { count: number }[];
  const completed = rows[0]?.count ?? 0;

  const daysElapsed =
    Math.round(
      (new Date(`${today}T12:00:00Z`).getTime() -
        new Date(`${weekStart}T12:00:00Z`).getTime()) /
        DAY_MS
    ) + 1;
  const possible = itemCount * daysElapsed;

  return possible === 0 ? 0 : Math.round((completed / possible) * 100);
}

export async function toggleCompletion(
  itemId: number,
  day: string
): Promise<boolean> {
  const existing = (await sql`
    SELECT 1 FROM checklist_completions WHERE item_id = ${itemId} AND day = ${day}
  `) as unknown as unknown[];

  if (existing.length > 0) {
    await sql`DELETE FROM checklist_completions WHERE item_id = ${itemId} AND day = ${day}`;
    return false;
  }

  await sql`INSERT INTO checklist_completions (item_id, day) VALUES (${itemId}, ${day})`;
  return true;
}
