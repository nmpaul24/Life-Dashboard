import { NextRequest, NextResponse } from "next/server";
import { createGoogleEvent } from "@/lib/google-calendar";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const startsAt = body.starts_at;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!startsAt || Number.isNaN(Date.parse(startsAt))) {
    return NextResponse.json(
      { error: "starts_at must be a valid date/time" },
      { status: 400 }
    );
  }

  const event = await createGoogleEvent(title, new Date(startsAt).toISOString());
  if (!event) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 502 }
    );
  }
  return NextResponse.json(event, { status: 201 });
}
