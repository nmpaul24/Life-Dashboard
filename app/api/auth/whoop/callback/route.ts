import { NextRequest, NextResponse } from "next/server";
import { WHOOP_TOKEN_URL, saveWhoopTokens } from "@/lib/whoop";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("whoop_oauth_state")?.value;

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }
  if (!state || state !== expectedState) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "WHOOP_CLIENT_ID/WHOOP_CLIENT_SECRET is not set" },
      { status: 500 }
    );
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/whoop/callback`;

  const tokenRes = await fetch(WHOOP_TOKEN_URL, {
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
    console.error(`WHOOP token exchange failed: ${tokenRes.status}: ${body}`);
    return NextResponse.json(
      { error: "Token exchange failed" },
      { status: 502 }
    );
  }

  const data = await tokenRes.json();
  await saveWhoopTokens(data);

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete("whoop_oauth_state");
  return response;
}
