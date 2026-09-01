import { sql } from "./db";

const TIME_ZONE = "America/Chicago";

function todayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

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

type RawAccount = {
  account_id: string;
  name: string;
  official_name: string | null;
  subtype: string | null;
  balances: {
    current: number | null;
    available: number | null;
    iso_currency_code: string | null;
  };
};

export type InvestmentCategory = "roth" | "brokerage";

function categorize(account: RawAccount): InvestmentCategory | null {
  const name = `${account.name} ${account.official_name ?? ""}`.toLowerCase();
  if (name.includes("roth")) return "roth";
  if (account.subtype === "brokerage") return "brokerage";
  return null;
}

type StoredItem = {
  itemId: string;
  accessToken: string;
  institutionName: string | null;
  cachedAccounts: RawAccount[] | null;
  cachedAt: Date | null;
};

async function loadAllItems(): Promise<StoredItem[]> {
  const rows = (await sql`
    SELECT item_id, access_token, institution_name, cached_accounts, cached_at
    FROM plaid_items
    ORDER BY created_at
  `) as unknown as {
    item_id: string;
    access_token: string;
    institution_name: string | null;
    cached_accounts: RawAccount[] | string | null;
    cached_at: string | null;
  }[];

  return rows.map((row) => ({
    itemId: row.item_id,
    accessToken: row.access_token,
    institutionName: row.institution_name,
    cachedAccounts:
      typeof row.cached_accounts === "string"
        ? JSON.parse(row.cached_accounts)
        : row.cached_accounts,
    cachedAt: row.cached_at ? new Date(row.cached_at) : null,
  }));
}

async function cacheAccounts(itemId: string, accounts: RawAccount[]) {
  await sql`
    UPDATE plaid_items
    SET cached_accounts = ${JSON.stringify(accounts)}::jsonb, cached_at = now()
    WHERE item_id = ${itemId}
  `;
}

export type PlaidAccountBalance = {
  accountId: string;
  institutionName: string | null;
  accountName: string;
  officialName: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  currencyCode: string | null;
  category: InvestmentCategory | null;
};

function toBalances(
  item: StoredItem,
  accounts: RawAccount[]
): PlaidAccountBalance[] {
  return accounts.map((account) => ({
    accountId: account.account_id,
    institutionName: item.institutionName,
    accountName: account.name,
    officialName: account.official_name,
    currentBalance: account.balances.current,
    availableBalance: account.balances.available,
    currencyCode: account.balances.iso_currency_code,
    category: categorize(account),
  }));
}

// Plaid rate-limits how often the balance endpoint can be called per Item,
// and this page re-fetches on every load - so cache for a while and only
// hit Plaid again once the cache is stale.
const CACHE_TTL_MS = 15 * 60 * 1000;

async function getBalancesForItem(
  item: StoredItem
): Promise<PlaidAccountBalance[]> {
  const isFresh =
    item.cachedAt !== null && Date.now() - item.cachedAt.getTime() < CACHE_TTL_MS;

  if (isFresh && item.cachedAccounts) {
    return toBalances(item, item.cachedAccounts);
  }

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
    // Fall back to whatever we last cached (even if stale) rather than
    // showing nothing, e.g. when rate-limited.
    if (item.cachedAccounts) {
      return toBalances(item, item.cachedAccounts);
    }
    return [];
  }

  const data = await res.json();
  const accounts = data.accounts as RawAccount[];
  await cacheAccounts(item.itemId, accounts);
  return toBalances(item, accounts);
}

async function recordDailySnapshots(balances: PlaidAccountBalance[]) {
  const day = todayKey();
  const trackable = balances.filter(
    (b) => b.category !== null && b.currentBalance !== null
  );

  await Promise.all(
    trackable.map(
      (b) => sql`
        INSERT INTO investment_balance_history (account_id, day, category, balance)
        VALUES (${b.accountId}, ${day}, ${b.category}, ${b.currentBalance})
        ON CONFLICT (account_id, day) DO UPDATE SET
          balance = EXCLUDED.balance,
          category = EXCLUDED.category
      `
    )
  );
}

export async function getAccountBalances(): Promise<PlaidAccountBalance[] | null> {
  const items = await loadAllItems();
  if (items.length === 0) return null;

  const results = await Promise.all(items.map(getBalancesForItem));
  const balances = results.flat();
  await recordDailySnapshots(balances);
  return balances;
}

export type InvestmentHistoryPoint = {
  day: string;
  roth: number | null;
  brokerage: number | null;
};

export async function getInvestmentHistory(
  days = 90
): Promise<InvestmentHistoryPoint[]> {
  const rows = (await sql`
    SELECT day::text AS day, category, SUM(balance)::float AS balance
    FROM investment_balance_history
    WHERE day >= CURRENT_DATE - ${days}::int
    GROUP BY day, category
    ORDER BY day
  `) as unknown as { day: string; category: InvestmentCategory; balance: number }[];

  const byDay = new Map<string, InvestmentHistoryPoint>();
  for (const row of rows) {
    const point = byDay.get(row.day) ?? { day: row.day, roth: null, brokerage: null };
    point[row.category] = row.balance;
    byDay.set(row.day, point);
  }

  return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
}
