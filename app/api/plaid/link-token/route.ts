import { NextResponse } from "next/server";
import { createLinkToken } from "@/lib/plaid";

export async function GET() {
  try {
    const linkToken = await createLinkToken();
    return NextResponse.json({ link_token: linkToken });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 }
    );
  }
}
