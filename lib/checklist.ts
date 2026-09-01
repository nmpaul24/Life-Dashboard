import { sql } from "./db";

const TIME_ZONE = "America/Chicago";

export type ChecklistItem = { id: number; text: string };

export function todayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
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
