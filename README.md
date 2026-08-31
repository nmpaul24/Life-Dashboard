# Life Dashboard

A personal life dashboard: goals (daily and long-term) backed by Postgres,
a current-weather widget for Minneapolis, MN, and a WHOOP connection for
recovery/sleep/strain data.

Stack: Next.js (App Router) + TypeScript, Tailwind CSS, Postgres via Neon,
OpenWeatherMap for weather, WHOOP OAuth, deployed on Vercel.

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

## 4. Configure the app locally

1. Copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Paste your Neon connection string as `DATABASE_URL`, your OpenWeatherMap
   key as `OPENWEATHER_API_KEY`, and your WHOOP credentials as
   `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` in `.env.local`.

3. Install dependencies and create the tables by running the SQL in
   [`db/schema.sql`](./db/schema.sql) against your Neon database (it's
   idempotent — safe to re-run even if `goals` already exists). Easiest way:
   open the **SQL Editor** in the Neon console, paste the contents of
   `db/schema.sql`, and run it.

   (Alternatively, from a terminal with `psql` installed:
   `psql "$DATABASE_URL" -f db/schema.sql`)

## 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the
dashboard with the current weather for Minneapolis, MN, a "Connect WHOOP"
button, and a form to add goals (daily or long-term) with lists to check
them off or delete them.

## 6. Push to GitHub

```bash
git add -A
git commit -m "Scaffold life dashboard: goals feature"
git push -u origin <your-branch-name>
```

(If the repo isn't connected to GitHub yet: create an empty repo on GitHub,
then `git remote add origin <repo-url>` before pushing.)

## 7. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub
   repository.
2. Framework preset should auto-detect as **Next.js** — leave build settings
   as default.
3. Before deploying, add four environment variables (apply all to Production
   and Preview):
   - **Name:** `DATABASE_URL` — **Value:** your Neon connection string
   - **Name:** `OPENWEATHER_API_KEY` — **Value:** your OpenWeatherMap key
   - **Name:** `WHOOP_CLIENT_ID` — **Value:** your WHOOP client ID
   - **Name:** `WHOOP_CLIENT_SECRET` — **Value:** your WHOOP client secret
4. Click **Deploy**. Once it finishes, Vercel gives you a live URL.
5. Make sure the tables in `db/schema.sql` exist in your Neon database (step
   4.3) — Vercel doesn't create them for you.
6. On the dashboard, click **Connect WHOOP** and authorize — this only needs
   to be done once; the app stores and auto-refreshes the token. Once
   connected, it shows your latest Recovery %, Sleep performance %, and
   Strain (the daily overall number WHOOP's home screen shows, i.e. Cycle
   strain — not per-workout strain).

## Project structure

```
app/
  page.tsx                       - dashboard page (fetches goals + weather server-side)
  weather-widget.tsx              - presentational weather card
  whoop-widget.tsx                 - connect button, or latest recovery/sleep/strain
  goals-board.tsx                  - client component: add/view/check off/delete goals
  privacy/page.tsx                 - minimal privacy policy (required by WHOOP's app form)
  api/goals/route.ts               - GET (list) / POST (create)
  api/goals/[id]/route.ts          - PATCH (toggle complete) / DELETE
  api/auth/whoop/route.ts          - starts the WHOOP OAuth flow
  api/auth/whoop/callback/route.ts - exchanges the auth code for tokens, stores them
lib/db.ts                         - Postgres client (Neon)
lib/weather.ts                    - OpenWeatherMap fetch for Minneapolis, MN
lib/whoop.ts                      - WHOOP token storage/refresh + recovery/sleep/strain fetches
db/schema.sql                     - table definitions (goals, whoop_tokens)
```

## Out of scope for this pass

No authentication (single-user), no calendar/email/Canvas integrations yet.
