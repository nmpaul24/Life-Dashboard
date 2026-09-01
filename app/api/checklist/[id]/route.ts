import { NextRequest, NextResponse } from "next/server";
import { todayKey, toggleCompletion } from "@/lib/checklist";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = Number(id);
  if (Number.isNaN(itemId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const completed = await toggleCompletion(itemId, todayKey());

  return NextResponse.json({ completed });
}
