CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'long_term')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
CREATE TABLE IF NOT EXISTS plaid_items (
  id SERIAL PRIMARY KEY,
  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  institution_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
