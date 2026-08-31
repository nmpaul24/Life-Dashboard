import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const events = await sql`
    SELECT * FROM events ORDER BY starts_at ASC
  `;
  return NextResponse.json(events);
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

  const [event] = await sql`
    INSERT INTO events (title, starts_at)
    VALUES (${title}, ${new Date(startsAt).toISOString()})
    RETURNING *
  `;
  return NextResponse.json(event, { status: 201 });
}
