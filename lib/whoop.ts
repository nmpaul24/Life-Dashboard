import { sql } from "./db";

export const WHOOP_AUTHORIZE_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
export const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
export const WHOOP_SCOPES = "read:recovery read:cycles read:sleep read:profile";
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";

type WhoopTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type StoredTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
};

export async function saveWhoopTokens(tokens: WhoopTokenResponse) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await sql`
    INSERT INTO whoop_tokens (id, access_token, refresh_token, expires_at)
    VALUES (true, ${tokens.access_token}, ${tokens.refresh_token ?? null}, ${expiresAt.toISOString()})
    ON CONFLICT (id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, whoop_tokens.refresh_token),
      expires_at = EXCLUDED.expires_at
  `;
}

async function loadWhoopTokens(): Promise<StoredTokens | null> {
  const rows = (await sql`
    SELECT access_token, refresh_token, expires_at FROM whoop_tokens WHERE id = true
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

export async function hasWhoopTokens(): Promise<boolean> {
  const rows = (await sql`SELECT 1 FROM whoop_tokens WHERE id = true`) as unknown as unknown[];
  return rows.length > 0;
}

async function refreshWhoopToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("refreshWhoopToken: WHOOP_CLIENT_ID/WHOOP_CLIENT_SECRET is not set");
    return null;
  }

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      scope: WHOOP_SCOPES,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`refreshWhoopToken: WHOOP returned ${res.status}: ${body}`);
    return null;
  }

  const data: WhoopTokenResponse = await res.json();
  await saveWhoopTokens({ ...data, refresh_token: data.refresh_token ?? refreshToken });
  return data.access_token;
}

// Returns a valid access token (refreshing it if it's expired or about to
// expire), or null if WHOOP isn't connected yet / refresh failed.
export async function getWhoopAccessToken(): Promise<string | null> {
  const tokens = await loadWhoopTokens();
  if (!tokens) return null;

  const isExpiringSoon = tokens.expiresAt.getTime() - Date.now() < 60_000;
  if (!isExpiringSoon) return tokens.accessToken;

  if (!tokens.refreshToken) {
    console.error("getWhoopAccessToken: token expired and no refresh_token stored");
    return null;
  }

  return refreshWhoopToken(tokens.refreshToken);
}

type WhoopCollection<T> = { records: T[] };

async function whoopGet<T>(path: string): Promise<T | null> {
  const accessToken = await getWhoopAccessToken();
  if (!accessToken) return null;

  const res = await fetch(`${WHOOP_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`whoopGet ${path}: WHOOP returned ${res.status}: ${body}`);
    return null;
  }

  return res.json();
}

type RawRecovery = {
  score_state: string;
  score?: {
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
  };
};

export type WhoopRecovery = {
  recoveryScore: number;
  restingHeartRate: number;
  hrvMilli: number;
};

export async function getWhoopRecovery(): Promise<WhoopRecovery | null> {
  const data = await whoopGet<WhoopCollection<RawRecovery>>("/recovery?limit=1");
  const record = data?.records?.[0];
  if (!record || record.score_state !== "SCORED" || !record.score) return null;

  return {
    recoveryScore: Math.round(record.score.recovery_score),
    restingHeartRate: record.score.resting_heart_rate,
    hrvMilli: Math.round(record.score.hrv_rmssd_milli),
  };
}

type RawSleep = {
  score_state: string;
  score?: {
    sleep_performance_percentage: number;
    sleep_efficiency_percentage: number;
  };
};

export type WhoopSleep = {
  performancePercent: number;
  efficiencyPercent: number;
};

export async function getWhoopSleep(): Promise<WhoopSleep | null> {
  const data = await whoopGet<WhoopCollection<RawSleep>>("/activity/sleep?limit=1");
  const record = data?.records?.[0];
  if (!record || record.score_state !== "SCORED" || !record.score) return null;

  return {
    performancePercent: Math.round(record.score.sleep_performance_percentage),
    efficiencyPercent: Math.round(record.score.sleep_efficiency_percentage),
  };
}

type RawCycle = {
  score_state: string;
  score?: {
    strain: number;
    average_heart_rate: number;
  };
};

export type WhoopStrain = {
  strain: number;
  averageHeartRate: number;
};

// The "Strain" number shown on WHOOP's home screen is the daily Cycle
// strain (as opposed to per-workout strain).
export async function getWhoopStrain(): Promise<WhoopStrain | null> {
  const data = await whoopGet<WhoopCollection<RawCycle>>("/cycle?limit=1");
  const record = data?.records?.[0];
  if (!record || record.score_state !== "SCORED" || !record.score) return null;

  return {
    strain: Math.round(record.score.strain * 10) / 10,
    averageHeartRate: record.score.average_heart_rate,
  };
}
