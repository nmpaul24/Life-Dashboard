import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_TOKEN_URL, saveGoogleTokens } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET is not set" },
      { status: 500 }
    );
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => "");
    console.error(`Google token exchange failed: ${tokenRes.status}: ${body}`);
    return NextResponse.json(
      { error: "Token exchange failed" },
      { status: 502 }
    );
  }

  const data = await tokenRes.json();
  await saveGoogleTokens(data);

  return NextResponse.redirect(new URL("/", request.url));
}
