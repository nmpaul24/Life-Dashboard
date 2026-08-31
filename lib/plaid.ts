import { sql } from "./db";

function plaidBaseUrl(): string {
  const env = process.env.PLAID_ENV ?? "sandbox";
  return `https://${env}.plaid.com`;
}

function plaidCredentials() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID/PLAID_SECRET is not set");
  }
  return { client_id: clientId, secret };
}

export async function createLinkToken(): Promise<string> {
  const res = await fetch(`${plaidBaseUrl()}/link/token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...plaidCredentials(),
      client_name: "Life Dashboard",
      user: { client_user_id: "life-dashboard-single-user" },
      products: ["investments"],
      country_codes: ["US"],
      language: "en",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`createLinkToken: Plaid returned ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.link_token;
}

export async function exchangePublicToken(publicToken: string): Promise<void> {
  const res = await fetch(`${plaidBaseUrl()}/item/public_token/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...plaidCredentials(),
      public_token: publicToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `exchangePublicToken: Plaid returned ${res.status}: ${body}`
    );
  }

  const data = await res.json();

  await sql`
    INSERT INTO plaid_items (id, access_token, item_id)
    VALUES (true, ${data.access_token}, ${data.item_id})
    ON CONFLICT (id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      item_id = EXCLUDED.item_id
  `;
}

export async function hasPlaidItem(): Promise<boolean> {
  const rows = (await sql`SELECT 1 FROM plaid_items WHERE id = true`) as unknown as unknown[];
  return rows.length > 0;
}

async function loadAccessToken(): Promise<string | null> {
  const rows = (await sql`
    SELECT access_token FROM plaid_items WHERE id = true
  `) as unknown as { access_token: string }[];
  return rows[0]?.access_token ?? null;
}

export type PlaidAccountBalance = {
  name: string;
  officialName: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  currencyCode: string | null;
};

export async function getAccountBalances(): Promise<PlaidAccountBalance[] | null> {
  const accessToken = await loadAccessToken();
  if (!accessToken) return null;

  const res = await fetch(`${plaidBaseUrl()}/accounts/balance/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...plaidCredentials(),
      access_token: accessToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`getAccountBalances: Plaid returned ${res.status}: ${body}`);
    return null;
  }

  const data = await res.json();

  type RawAccount = {
    name: string;
    official_name: string | null;
    balances: {
      current: number | null;
      available: number | null;
      iso_currency_code: string | null;
    };
  };

  return (data.accounts as RawAccount[]).map((account) => ({
    name: account.name,
    officialName: account.official_name,
    currentBalance: account.balances.current,
    availableBalance: account.balances.available,
    currencyCode: account.balances.iso_currency_code,
  }));
}
