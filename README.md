# Life Dashboard

A personal life dashboard. First pass scope: a single dashboard page for
tracking goals (daily and long-term), backed by Postgres.

Stack: Next.js (App Router) + TypeScript, Tailwind CSS, Postgres via Neon,
deployed on Vercel.

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

## 2. Configure the app locally

1. Copy the example env file:

   ```bash
   cp .env.local.example .env.local
   ```

2. Paste your Neon connection string as `DATABASE_URL` in `.env.local`.

3. Install dependencies and create the `goals` table by running the SQL in
   [`db/schema.sql`](./db/schema.sql) against your Neon database. Easiest way:
   open the **SQL Editor** in the Neon console, paste the contents of
   `db/schema.sql`, and run it.

   (Alternatively, from a terminal with `psql` installed:
   `psql "$DATABASE_URL" -f db/schema.sql`)

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the
dashboard with a form to add goals (daily or long-term) and lists to check
them off or delete them.

## 4. Push to GitHub

```bash
git add -A
git commit -m "Scaffold life dashboard: goals feature"
git push -u origin <your-branch-name>
```

(If the repo isn't connected to GitHub yet: create an empty repo on GitHub,
then `git remote add origin <repo-url>` before pushing.)

## 5. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub
   repository.
2. Framework preset should auto-detect as **Next.js** — leave build settings
   as default.
3. Before deploying, add an environment variable:
   - **Name:** `DATABASE_URL`
   - **Value:** your Neon connection string (same one from step 1)
   - Apply it to all environments (Production, Preview, Development).
4. Click **Deploy**. Once it finishes, Vercel gives you a live URL.
5. Make sure the `goals` table exists in your Neon database (step 2.3) —
   Vercel doesn't create it for you.

## Project structure

```
app/
  page.tsx              - dashboard page (add/view/check off goals)
  api/goals/route.ts    - GET (list) / POST (create)
  api/goals/[id]/route.ts - PATCH (toggle complete) / DELETE
lib/db.ts               - Postgres client (Neon)
db/schema.sql           - goals table definition
```

## Out of scope for this pass

No authentication (single-user), no weather/calendar/email/WHOOP/Canvas
integrations yet.
