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

-- Daily Checklist: a fixed list of daily activities. checklist_completions
-- holds one row per item per day it was checked off, so the list resets
-- visually every day.
CREATE TABLE IF NOT EXISTS checklist_items (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO checklist_items (text, sort_order)
SELECT * FROM (VALUES
  ('Go to Gym', 0),
  ('Stretch', 1),
  ('Take Creatine', 2),
  ('10K+ Steps', 3)
) AS seed(text, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM checklist_items);

CREATE TABLE IF NOT EXISTS checklist_completions (
  item_id INTEGER NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  PRIMARY KEY (item_id, day)
);

-- One row per tracked investment account per day, so the Investments card
-- can graph balance over time. Recorded on every dashboard load from
-- whatever balance Plaid last returned (fresh or cached) - upserting on
-- (account_id, day) keeps one row per account per day regardless of how
-- many times the dashboard is loaded that day.
CREATE TABLE IF NOT EXISTS investment_balance_history (
  account_id TEXT NOT NULL,
  day DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('roth', 'brokerage')),
  balance NUMERIC NOT NULL,
  PRIMARY KEY (account_id, day)
);
