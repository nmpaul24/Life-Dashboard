CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'long_term')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No longer used by the app - Calendar now reads/writes real Google
-- Calendar events instead of this local table. Left in place rather than
-- dropped, since dropping risks data loss for no benefit.
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-row table holding this app's one Google Calendar OAuth token set.
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT google_calendar_tokens_singleton CHECK (id)
);

-- Single-row table holding this app's one WHOOP OAuth token set.
CREATE TABLE IF NOT EXISTS whoop_tokens (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT whoop_tokens_singleton CHECK (id)
);

-- Plaid Items (linked accounts, e.g. Fidelity, SoFi) — one row per connected institution.
-- cached_accounts/cached_at hold the last successful balance fetch, since
-- Plaid rate-limits the balance endpoint and this app checks it on every
-- page load.
CREATE TABLE IF NOT EXISTS plaid_items (
  id SERIAL PRIMARY KEY,
  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  institution_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE plaid_items ADD COLUMN IF NOT EXISTS cached_accounts JSONB;
ALTER TABLE plaid_items ADD COLUMN IF NOT EXISTS cached_at TIMESTAMPTZ;
