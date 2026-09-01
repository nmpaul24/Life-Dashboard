import { NextRequest, NextResponse } from "next/server";
import {
  getChecklistItems,
  getWeekPercent,
  todayKey,
  toggleCompletion,
  weekStartKey,
} from "@/lib/checklist";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = Number(id);
  if (Number.isNaN(itemId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const today = todayKey();
  const completed = await toggleCompletion(itemId, today);

  const items = await getChecklistItems();
  const weekPercent = await getWeekPercent(
    items.length,
    weekStartKey(today),
    today
  );

  return NextResponse.json({ completed, weekPercent });
}
