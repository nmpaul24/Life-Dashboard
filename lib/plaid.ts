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

export async function exchangePublicToken(
  publicToken: string,
  institutionName: string | null
): Promise<void> {
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
    INSERT INTO plaid_items (item_id, access_token, institution_name)
    VALUES (${data.item_id}, ${data.access_token}, ${institutionName})
    ON CONFLICT (item_id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      institution_name = EXCLUDED.institution_name
  `;
}

export async function hasPlaidItems(): Promise<boolean> {
  const rows = (await sql`SELECT 1 FROM plaid_items LIMIT 1`) as unknown as unknown[];
  return rows.length > 0;
}

type StoredItem = {
  itemId: string;
  accessToken: string;
  institutionName: string | null;
};

async function loadAllItems(): Promise<StoredItem[]> {
  const rows = (await sql`
    SELECT item_id, access_token, institution_name
    FROM plaid_items
    ORDER BY created_at
  `) as unknown as {
    item_id: string;
    access_token: string;
    institution_name: string | null;
  }[];

  return rows.map((row) => ({
    itemId: row.item_id,
    accessToken: row.access_token,
    institutionName: row.institution_name,
  }));
}

export type PlaidAccountBalance = {
  institutionName: string | null;
  accountName: string;
  officialName: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  currencyCode: string | null;
};

type RawAccount = {
  name: string;
  official_name: string | null;
  balances: {
    current: number | null;
    available: number | null;
    iso_currency_code: string | null;
  };
};

async function getBalancesForItem(
  item: StoredItem
): Promise<PlaidAccountBalance[]> {
  const res = await fetch(`${plaidBaseUrl()}/accounts/balance/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...plaidCredentials(),
      access_token: item.accessToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `getBalancesForItem (${item.institutionName ?? item.itemId}): Plaid returned ${res.status}: ${body}`
    );
    return [];
  }

  const data = await res.json();

  return (data.accounts as RawAccount[]).map((account) => ({
    institutionName: item.institutionName,
    accountName: account.name,
    officialName: account.official_name,
    currentBalance: account.balances.current,
    availableBalance: account.balances.available,
    currencyCode: account.balances.iso_currency_code,
  }));
}

export async function getAccountBalances(): Promise<PlaidAccountBalance[] | null> {
  const items = await loadAllItems();
  if (items.length === 0) return null;

  const results = await Promise.all(items.map(getBalancesForItem));
  return results.flat();
}
