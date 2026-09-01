import { NextRequest, NextResponse } from "next/server";
import { deleteGoogleEvent } from "@/lib/google-calendar";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const success = await deleteGoogleEvent(id);
  if (!success) {
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 502 }
    );
  }
  return NextResponse.json({ success: true });
}
