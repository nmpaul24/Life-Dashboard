import { sql } from "./db";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events";
const GOOGLE_CALENDAR_API =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

function googleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET is not set");
  }
  return { client_id: clientId, client_secret: clientSecret };
}

export async function saveGoogleTokens(tokens: GoogleTokenResponse) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await sql`
    INSERT INTO google_calendar_tokens (id, access_token, refresh_token, expires_at)
    VALUES (true, ${tokens.access_token}, ${tokens.refresh_token ?? null}, ${expiresAt.toISOString()})
    ON CONFLICT (id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, google_calendar_tokens.refresh_token),
      expires_at = EXCLUDED.expires_at
  `;
}

export async function hasGoogleTokens(): Promise<boolean> {
  const rows = (await sql`SELECT 1 FROM google_calendar_tokens WHERE id = true`) as unknown as unknown[];
  return rows.length > 0;
}

type StoredTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
};

async function loadTokens(): Promise<StoredTokens | null> {
  const rows = (await sql`
    SELECT access_token, refresh_token, expires_at FROM google_calendar_tokens WHERE id = true
  `) as unknown as {
    access_token: string;
    refresh_token: string | null;
    expires_at: string;
  }[];

  const row = rows[0];
  if (!row) return null;

  return {
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: new Date(row.expires_at),
  };
}

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      ...googleCredentials(),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`refreshGoogleToken: Google returned ${res.status}: ${body}`);
    return null;
  }

  const data: GoogleTokenResponse = await res.json();
  await saveGoogleTokens({ ...data, refresh_token: data.refresh_token ?? refreshToken });
  return data.access_token;
}

export async function getGoogleAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;

  const isExpiringSoon = tokens.expiresAt.getTime() - Date.now() < 60_000;
  if (!isExpiringSoon) return tokens.accessToken;

  if (!tokens.refreshToken) {
    console.error("getGoogleAccessToken: token expired and no refresh_token stored");
    return null;
  }

  return refreshGoogleToken(tokens.refreshToken);
}

export type GoogleEvent = {
  id: string;
  title: string;
  startsAt: string;
};

type RawGoogleEventItem = {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
};

export async function listGoogleEvents(
  timeMinIso: string,
  timeMaxIso: string
): Promise<GoogleEvent[] | null> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) return null;

  const url = new URL(GOOGLE_CALENDAR_API);
  url.searchParams.set("timeMin", timeMinIso);
  url.searchParams.set("timeMax", timeMaxIso);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`listGoogleEvents: Google returned ${res.status}: ${body}`);
    return null;
  }

  const data = await res.json();

  return (data.items as RawGoogleEventItem[]).map((item) => ({
    id: item.id,
    title: item.summary ?? "(No title)",
    startsAt: item.start.dateTime ?? `${item.start.date}T00:00:00`,
  }));
}

export async function createGoogleEvent(
  title: string,
  startsAtIso: string
): Promise<GoogleEvent | null> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) return null;

  const start = new Date(startsAtIso);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const res = await fetch(GOOGLE_CALENDAR_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: title,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`createGoogleEvent: Google returned ${res.status}: ${body}`);
    return null;
  }

  const item = await res.json();
  return {
    id: item.id,
    title: item.summary ?? title,
    startsAt: item.start?.dateTime ?? startsAtIso,
  };
}

export async function deleteGoogleEvent(eventId: string): Promise<boolean> {
  const accessToken = await getGoogleAccessToken();
  if (!accessToken) return false;

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok && res.status !== 410) {
    const body = await res.text().catch(() => "");
    console.error(`deleteGoogleEvent: Google returned ${res.status}: ${body}`);
    return false;
  }
  return true;
}
