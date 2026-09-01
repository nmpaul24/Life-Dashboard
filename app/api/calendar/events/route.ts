import { NextRequest, NextResponse } from "next/server";
import { createGoogleEvent, listGoogleEvents } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  if (!start || !end || Number.isNaN(Date.parse(start)) || Number.isNaN(Date.parse(end))) {
    return NextResponse.json(
      { error: "start and end must be valid dates" },
      { status: 400 }
    );
  }

  const events = await listGoogleEvents(start, end);
  return NextResponse.json(events ?? []);
}

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
