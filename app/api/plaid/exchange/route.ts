import { NextRequest, NextResponse } from "next/server";
import { exchangePublicToken } from "@/lib/plaid";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const publicToken = body.public_token;

  if (!publicToken || typeof publicToken !== "string") {
    return NextResponse.json(
      { error: "public_token is required" },
      { status: 400 }
    );
  }

  try {
    await exchangePublicToken(publicToken);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to exchange public token" },
      { status: 500 }
    );
  }
}
