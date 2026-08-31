import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const goals = await sql`
    SELECT * FROM goals ORDER BY created_at DESC
  `;
  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const type = body.type;

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (type !== "daily" && type !== "long_term") {
    return NextResponse.json(
      { error: 'type must be "daily" or "long_term"' },
      { status: 400 }
    );
  }

  const [goal] = await sql`
    INSERT INTO goals (text, type)
    VALUES (${text}, ${type})
    RETURNING *
  `;
  return NextResponse.json(goal, { status: 201 });
}
