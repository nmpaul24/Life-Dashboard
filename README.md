# Life Dashboard

A personal life dashboard: a To-Do List, a daily checklist (Gym, Stretch,
Take Creatine, 10K+ Steps) that resets each day, a Google Calendar
connection (two-way — view real events and add new ones from the
dashboard), a current-weather widget for Minneapolis, MN, a WHOOP
connection for recovery/sleep/strain data, and a Plaid connection for
linked investment account balances (e.g. Fidelity, SoFi).

Stack: Next.js (App Router) + TypeScript, Tailwind CSS, Postgres via Neon,
OpenWeatherMap for weather, WHOOP OAuth, Plaid for linked accounts, Google
Calendar OAuth, deployed on Vercel.

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

## 5. Register a Google Cloud OAuth app (for Google Calendar)

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create
   (or select) a project.
2. **APIs & Services → Library**: search for and enable the **Google
   Calendar API**.
3. **APIs & Services → OAuth consent screen**: choose **External** user type.
   Add the scope `https://www.googleapis.com/auth/calendar.events`. Under
   **Test users**, add your own Google account email — this keeps the app in
   "Testing" status, which skips Google's app-verification review.
   - Heads up: while in Testing status, Google expires refresh tokens after
     **7 days**, so you'd need to click Reconnect weekly. Publishing to
     Production avoids this, but `calendar.events` is a "sensitive" scope
     that Google may require verification for at that point — fine to leave
     in Testing for personal use and just reconnect if it lapses.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   Application type: **Web application**. Under **Authorized redirect
   URIs**, add exactly: `https://<your-domain>/api/auth/google/callback`
   (and `http://localhost:3000/api/auth/google/callback` for local testing).
5. Copy the **Client ID** and **Client Secret**.

## 6. Configure the app locally

1. Copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Paste your Neon connection string as `DATABASE_URL`, your OpenWeatherMap
   key as `OPENWEATHER_API_KEY`, your WHOOP credentials as
   `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET`, your Plaid credentials as
   `PLAID_CLIENT_ID` / `PLAID_SECRET` (plus `PLAID_ENV`), and your Google
   credentials as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in
   `.env.local`.

3. Install dependencies and create the tables by running the SQL in
   [`db/schema.sql`](./db/schema.sql) against your Neon database (it's
   idempotent — safe to re-run even if `goals` already exists). Easiest way:
   open the **SQL Editor** in the Neon console, paste the contents of
   `db/schema.sql`, and run it.

   (Alternatively, from a terminal with `psql` installed:
   `psql "$DATABASE_URL" -f db/schema.sql`)

## 7. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the
dashboard with the current weather for Minneapolis, MN, a "Connect WHOOP"
button, a "Connect an account" button (Plaid), a To-Do List (click "+ Add"
for a popup to add an item, check off or delete from the list), and a
Calendar showing "Connect Google Calendar" until you connect it, then the
current week as a 7-day grid pulling real events, with "+ Add" creating a
real event on your Google Calendar.

## 8. Push to GitHub

```bash
git add -A
git commit -m "Scaffold life dashboard: goals feature"
git push -u origin <your-branch-name>
```

(If the repo isn't connected to GitHub yet: create an empty repo on GitHub,
then `git remote add origin <repo-url>` before pushing.)

## 9. Deploy to Vercel

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
   - **Name:** `GOOGLE_CLIENT_ID` — **Value:** your Google OAuth client ID
   - **Name:** `GOOGLE_CLIENT_SECRET` — **Value:** your Google OAuth client
     secret
4. Click **Deploy**. Once it finishes, Vercel gives you a live URL.
5. Make sure the tables in `db/schema.sql` exist in your Neon database (step
   6.3) — Vercel doesn't create them for you.
6. Go back to your Google Cloud OAuth client and add this live URL's
   callback to **Authorized redirect URIs**:
   `https://<your-live-domain>/api/auth/google/callback`.
7. On the dashboard, click **Connect WHOOP** and authorize — this only needs
   to be done once; the app stores and auto-refreshes the token. Once
   connected, it shows your latest Recovery %, Sleep performance %, and
   Strain (the daily overall number WHOOP's home screen shows, i.e. Cycle
   strain — not per-workout strain).
8. Click **Connect an account** and go through Plaid Link. In Sandbox mode,
   use one of Plaid's test institutions with the test credentials
   `user_good` / `pass_good`. Click it again to link additional institutions
   (e.g. Fidelity, then SoFi) — each shows up as its own balance card.
9. Click **Connect Google Calendar** on the Calendar card and authorize —
   your real events should populate the week grid, and "+ Add" creates a
   real event on your calendar.

## Project structure

```
app/
  page.tsx                          - dashboard page (fetches goals + weather server-side)
  weather-widget.tsx                 - presentational weather card
  whoop-widget.tsx                    - connect button, or latest recovery/sleep/strain
  plaid-widget.tsx                    - connect button + each linked account's balance
  connect-account-button.tsx          - client component: loads Plaid Link, handles the flow
  goals-board.tsx                     - To-Do List: single list, add via popup, check off/delete
  checklist-widget.tsx                 - Daily Checklist: fixed items, checks off/resets daily
  calendar-widget.tsx                  - Calendar server wrapper: connect button, or fetches
                                          Google events and renders the board below
  calendar-board.tsx                   - Calendar client component: week grid, day popup, delete
  add-event-button.tsx                 - client component: "+ Add" popup that creates a Google event
  modal.tsx                            - shared popup/modal used across widgets
  privacy/page.tsx                    - minimal privacy policy (required by WHOOP's app form)
  api/goals/route.ts                  - GET (list) / POST (create)
  api/goals/[id]/route.ts             - PATCH (toggle complete) / DELETE
  api/auth/whoop/route.ts             - starts the WHOOP OAuth flow
  api/auth/whoop/callback/route.ts    - exchanges the auth code for tokens, stores them
  api/auth/google/route.ts            - starts the Google OAuth flow
  api/auth/google/callback/route.ts   - exchanges the auth code for tokens, stores them
  api/plaid/link-token/route.ts       - creates a Plaid Link token
  api/plaid/exchange/route.ts         - exchanges Plaid's public token for an access token, stores it
  api/calendar/events/route.ts        - GET (list events in a range) / POST (create an event)
  api/calendar/events/[id]/route.ts   - DELETE (a Google Calendar event)
  api/checklist/[id]/route.ts         - PATCH (toggle today's completion for a checklist item)
lib/db.ts                            - Postgres client (Neon)
lib/weather.ts                       - OpenWeatherMap fetch for Minneapolis, MN
lib/whoop.ts                         - WHOOP token storage/refresh + recovery/sleep/strain fetches
lib/plaid.ts                         - Plaid Item storage (multiple institutions) + balance fetch
lib/google-calendar.ts               - Google token storage/refresh + list/create/delete events
lib/checklist.ts                     - checklist items/completions storage
db/schema.sql                        - table definitions (goals, whoop_tokens, plaid_items,
                                         google_calendar_tokens, checklist_items,
                                         checklist_completions; `events` kept but unused)
```

## Out of scope for this pass

No authentication (single-user), no email/Canvas integrations yet.
