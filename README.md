# Life Dashboard

A personal life dashboard: goals (daily and long-term) backed by Postgres,
plus a current-weather widget for Minneapolis, MN.

Stack: Next.js (App Router) + TypeScript, Tailwind CSS, Postgres via Neon,
OpenWeatherMap for weather, deployed on Vercel.

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

## 3. Configure the app locally

1. Copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Paste your Neon connection string as `DATABASE_URL` and your OpenWeatherMap
   key as `OPENWEATHER_API_KEY` in `.env.local`.

3. Install dependencies and create the `goals` table by running the SQL in
   [`db/schema.sql`](./db/schema.sql) against your Neon database. Easiest way:
   open the **SQL Editor** in the Neon console, paste the contents of
   `db/schema.sql`, and run it.

   (Alternatively, from a terminal with `psql` installed:
   `psql "$DATABASE_URL" -f db/schema.sql`)

## 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the
dashboard with the current weather for Minneapolis, MN, and a form to add
goals (daily or long-term) with lists to check them off or delete them.

## 5. Push to GitHub

```bash
git add -A
git commit -m "Scaffold life dashboard: goals feature"
git push -u origin <your-branch-name>
```

(If the repo isn't connected to GitHub yet: create an empty repo on GitHub,
then `git remote add origin <repo-url>` before pushing.)

## 6. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub
   repository.
2. Framework preset should auto-detect as **Next.js** — leave build settings
   as default.
3. Before deploying, add two environment variables:
   - **Name:** `DATABASE_URL` — **Value:** your Neon connection string
   - **Name:** `OPENWEATHER_API_KEY` — **Value:** your OpenWeatherMap key
   - Apply both to Production and Preview.
4. Click **Deploy**. Once it finishes, Vercel gives you a live URL.
5. Make sure the `goals` table exists in your Neon database (step 3.3) —
   Vercel doesn't create it for you.

## Project structure

```
app/
  page.tsx                 - dashboard page (fetches goals + weather server-side)
  weather-widget.tsx        - presentational weather card
  goals-board.tsx           - client component: add/view/check off/delete goals
  api/goals/route.ts        - GET (list) / POST (create)
  api/goals/[id]/route.ts   - PATCH (toggle complete) / DELETE
lib/db.ts                  - Postgres client (Neon)
lib/weather.ts              - OpenWeatherMap fetch for Minneapolis, MN
db/schema.sql              - goals table definition
```

## Out of scope for this pass

No authentication (single-user), no calendar/email/WHOOP/Canvas integrations
yet.
