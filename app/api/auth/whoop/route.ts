import { NextRequest, NextResponse } from "next/server";
import { WHOOP_AUTHORIZE_URL, WHOOP_SCOPES } from "@/lib/whoop";

const STATE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomState(length = 8) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += STATE_CHARS[Math.floor(Math.random() * STATE_CHARS.length)];
  }
  return out;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.WHOOP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "WHOOP_CLIENT_ID is not set" },
      { status: 500 }
    );
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/whoop/callback`;
  const state = randomState();

  const authorizeUrl = new URL(WHOOP_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", WHOOP_SCOPES);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("whoop_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
