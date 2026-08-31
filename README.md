# Life Dashboard

A personal life dashboard: goals (daily and long-term) and a calendar
(events) backed by Postgres, a current-weather widget for Minneapolis, MN,
a WHOOP connection for recovery/sleep/strain data, and a Plaid connection
for linked investment account balances (e.g. Fidelity, SoFi).

Stack: Next.js (App Router) + TypeScript, Tailwind CSS, Postgres via Neon,
OpenWeatherMap for weather, WHOOP OAuth, Plaid for linked accounts, deployed
on Vercel.

## 1. Create a Neon Postgres database (free tier)

1. Go to [neon.com](https://neon.com) and sign up (GitHub login works).
2. Click **Create a project**. Pick any name (e.g. `life-dashboard`) and a
   region close to you, then create it. The free tier is selected by default.
3. Once the project is created, Neon shows a **Connection String** on the
   project dashboard (also under **Connect** / **Connection Details**). It
   looks like:

   ```
   postgresql://<user>:<password>@<host>/<database>?sslmode=require
   ```

4. Copy that string.

## 2. Get an OpenWeatherMap API key

1. Go to [openweathermap.org/api](https://openweathermap.org/api) and sign up
   (free tier).
2. Under your account's **API keys** tab, copy the default key (a fresh key
   can take up to ~2 hours to activate).

## 3. Register a WHOOP developer app

1. Go to [developer.whoop.com](https://developer.whoop.com) and create an app.
2. Set the **Redirect URL** to your deployed app's callback, exactly:
   `https://<your-domain>/api/auth/whoop/callback` (and optionally
   `http://localhost:3000/api/auth/whoop/callback` for local testing, if the
   form allows a second redirect URL).
3. Set the **Privacy Policy** URL to `https://<your-domain>/privacy` (a
   minimal privacy page is included in this app at that route).
4. Copy the **Client ID** and **Client Secret** WHOOP gives you.

## 4. Create a Plaid developer account (for linked investment accounts)

1. Go to [dashboard.plaid.com/signup](https://dashboard.plaid.com/signup) and
   sign up (free).
2. Under **Team Settings → Keys**, copy the **Client ID** and the **Sandbox
   secret**.
3. This app can run against either Plaid environment:
   - **Sandbox** (`PLAID_ENV=sandbox`) — works immediately with Plaid's fake
     test institutions/credentials (e.g. "First Platypus Bank" with
     `user_good` / `pass_good`), no approval needed. Good for testing the
     flow before connecting real accounts.
   - **Production** (`PLAID_ENV=production`) — connects your real accounts
     (Fidelity, SoFi, etc.). Investment accounts are billed per connected
     Item under Plaid's Investments product (check Plaid's current pricing —
     this is a real, small recurring cost per linked account, not free).
     Swap `PLAID_CLIENT_ID` / `PLAID_SECRET` for the Production values from
     the same Keys page. Sandbox and Production are separate systems — a
     Sandbox connection won't carry over, you'll need to reconnect.
4. The **Connect an account** button supports linking multiple institutions
   — click it again anytime to add another (e.g. connect Fidelity, then
   click it again to also connect SoFi). Each shows up as its own balance
   card.

## 5. Configure the app locally

1. Copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Paste your Neon connection string as `DATABASE_URL`, your OpenWeatherMap
   key as `OPENWEATHER_API_KEY`, your WHOOP credentials as
   `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET`, and your Plaid credentials as
   `PLAID_CLIENT_ID` / `PLAID_SECRET` (plus `PLAID_ENV`) in `.env.local`.

3. Install dependencies and create the tables by running the SQL in
   [`db/schema.sql`](./db/schema.sql) against your Neon database (it's
   idempotent — safe to re-run even if `goals` already exists). Easiest way:
   open the **SQL Editor** in the Neon console, paste the contents of
   `db/schema.sql`, and run it.

   (Alternatively, from a terminal with `psql` installed:
   `psql "$DATABASE_URL" -f db/schema.sql`)

## 6. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the
dashboard with the current weather for Minneapolis, MN, a "Connect WHOOP"
button, a "Connect an account" button (Plaid), a form to add goals (daily
or long-term) with lists to check them off or delete them, and a calendar
to add/delete events.

## 7. Push to GitHub

```bash
git add -A
git commit -m "Scaffold life dashboard: goals feature"
git push -u origin <your-branch-name>
```

(If the repo isn't connected to GitHub yet: create an empty repo on GitHub,
then `git remote add origin <repo-url>` before pushing.)

## 8. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub
   repository.
2. Framework preset should auto-detect as **Next.js** — leave build settings
   as default.
3. Before deploying, add these environment variables (apply all to
   Production and Preview):
   - **Name:** `DATABASE_URL` — **Value:** your Neon connection string
   - **Name:** `OPENWEATHER_API_KEY` — **Value:** your OpenWeatherMap key
   - **Name:** `WHOOP_CLIENT_ID` — **Value:** your WHOOP client ID
   - **Name:** `WHOOP_CLIENT_SECRET` — **Value:** your WHOOP client secret
   - **Name:** `PLAID_CLIENT_ID` — **Value:** your Plaid client ID
   - **Name:** `PLAID_SECRET` — **Value:** your Plaid secret (Sandbox or
     Production, matching `PLAID_ENV`)
   - **Name:** `PLAID_ENV` — **Value:** `sandbox` or `production`
4. Click **Deploy**. Once it finishes, Vercel gives you a live URL.
5. Make sure the tables in `db/schema.sql` exist in your Neon database (step
   5.3) — Vercel doesn't create them for you.
6. On the dashboard, click **Connect WHOOP** and authorize — this only needs
   to be done once; the app stores and auto-refreshes the token. Once
   connected, it shows your latest Recovery %, Sleep performance %, and
   Strain (the daily overall number WHOOP's home screen shows, i.e. Cycle
   strain — not per-workout strain).
7. Click **Connect an account** and go through Plaid Link. In Sandbox mode,
   use one of Plaid's test institutions with the test credentials
   `user_good` / `pass_good`. Click it again to link additional institutions
   (e.g. Fidelity, then SoFi) — each shows up as its own balance card.

## Project structure

```
app/
  page.tsx                       - dashboard page (fetches goals/events + weather server-side)
  weather-widget.tsx              - presentational weather card
  whoop-widget.tsx                 - connect button, or latest recovery/sleep/strain
  plaid-widget.tsx                 - connect button + each linked account's balance
  connect-account-button.tsx       - client component: loads Plaid Link, handles the flow
  goals-board.tsx                  - client component: add/view/check off/delete goals
  calendar-widget.tsx               - client component: add/view/delete events
  privacy/page.tsx                 - minimal privacy policy (required by WHOOP's app form)
  api/goals/route.ts               - GET (list) / POST (create)
  api/goals/[id]/route.ts          - PATCH (toggle complete) / DELETE
  api/events/route.ts              - GET (list) / POST (create)
  api/events/[id]/route.ts         - DELETE
  api/auth/whoop/route.ts          - starts the WHOOP OAuth flow
  api/auth/whoop/callback/route.ts - exchanges the auth code for tokens, stores them
  api/plaid/link-token/route.ts    - creates a Plaid Link token
  api/plaid/exchange/route.ts      - exchanges Plaid's public token for an access token, stores it
lib/db.ts                         - Postgres client (Neon)
lib/weather.ts                    - OpenWeatherMap fetch for Minneapolis, MN
lib/whoop.ts                      - WHOOP token storage/refresh + recovery/sleep/strain fetches
lib/plaid.ts                      - Plaid Item storage (multiple institutions) + balance fetch
db/schema.sql                     - table definitions (goals, events, whoop_tokens, plaid_items)
```

## Out of scope for this pass

No authentication (single-user), no external calendar (Google/Apple) or
email/Canvas integrations yet — the calendar is native to this app only.
