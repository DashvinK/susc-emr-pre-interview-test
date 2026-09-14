# Setup — serverless, no credit card

This runs the whole system for **free with no credit card**, on three services:

| Piece | Service | What it does |
|---|---|---|
| Form + `/api/submit` | **Vercel** | Serves the Next.js site; the route validates and inserts into Supabase |
| Database + PDF storage | **Supabase** | Postgres (`responses`, `results`) + a private `reports` bucket |
| Batch (score → Groq → PDF) | **GitHub Actions** | Scheduled workflow runs `backend/run_batch.py` |

None of these require a card for the free tier. **Time:** ~30–40 min.

---

## Part 0 — Push the repo to GitHub

Vercel and GitHub Actions both deploy from a GitHub repo.

```bash
# from the project root
git init
git add .
git commit -m "SUSC EMR pre-interview assessment"
gh repo create susc-emr --private --source=. --push   # or create it on github.com and push
```

> `.env`, `.env.local`, and secrets are git-ignored — only code and config are pushed.

---

## Part 1 — Supabase (database + storage)

1. Sign up at https://supabase.com with **GitHub** (no card). Create a project;
   pick a region near your candidates. Save the database password it shows.
2. **SQL Editor → New query** → paste the contents of
   [`supabase/schema.sql`](../supabase/schema.sql) → **Run**. This creates the
   `responses` and `results` tables (RLS on, no public policies) and the private
   `reports` storage bucket.
3. **Project Settings → API** — copy two values:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` key** (under *Project API keys* — the secret one, *not* `anon`)
     → `SUPABASE_SERVICE_ROLE_KEY`

> The `service_role` key bypasses row-level security. It lives only in Vercel
> and GitHub secrets — never in the browser, never committed.

---

## Part 2 — Groq (LLM)

1. Sign in at https://console.groq.com (no card).
2. **API Keys → Create API Key** → copy it → `GROQ_API_KEY`.
3. The code defaults to model `llama-3.1-8b-instant`. If Groq has retired it,
   pick a current one from the console and set it as `GROQ_MODEL` later.

---

## Part 3 — Deploy the frontend to Vercel

1. Sign in at https://vercel.com with GitHub (no card). **Add New → Project →**
   import your repo.
2. **Root Directory: `frontend`** (important — the app isn't at the repo root).
   Framework auto-detects as Next.js.
3. **Environment Variables** (Production + Preview):
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key
4. **Deploy.** You get a URL like `https://susc-emr.vercel.app`.

That URL *is* the whole candidate-facing app — the form and `/api/submit` are the
same deployment (same origin, so no CORS, no separate backend URL).

---

## Part 4 — Wire up the GitHub Actions batch job

The workflow is already in the repo at
[`.github/workflows/batch-analysis.yml`](../.github/workflows/batch-analysis.yml).
It just needs secrets.

1. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.
   Add three **secrets**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
2. (Optional) Under **Variables**, set `GROQ_MODEL` and/or `RUSH_THRESHOLD_MS` to
   override the defaults.
3. **Actions** tab → if prompted, enable workflows. The batch runs every 20
   minutes on its own; to test now, open **Batch analysis → Run workflow**.

> The workflow installs WeasyPrint's system libraries and the IBM Plex font on
> the runner automatically. (Fraunces isn't installed there, so the PDF's display
> font falls back to a system serif — the layout is unaffected.)

---

## Part 5 — End-to-end smoke test

1. Open your Vercel URL, complete the form, submit → thank-you page.
2. **Supabase → Table editor → `responses`** — your row is there immediately
   (`processed = false`).
3. **Actions → Batch analysis → Run workflow** (or wait ≤20 min). When it's green:
   - `results` table has a scored row (trait scores, flags, summaries, `pdf_url`).
   - **Storage → `reports`** has `<submission_id>.pdf`.
   - `responses.processed` is now `true`.
4. Test the flags on purpose: a candidate who doesn't pick "Neutral" for the
   check item → `attention_flag = fail`; one who races Section B → `rush_flag = fail`.

---

## Viewing results (the panel)

- **Supabase → Table editor → `results`** is the panel's dashboard. Sort/filter,
  and click a `pdf_url` to open a candidate's PDF (signed URL, valid ~1 year).
- Export the table to CSV from the Table editor if you want a spreadsheet.
- (Later, if you want a nicer view, this is where a small read-only admin page
  would plug in — the data's already in Postgres.)

---

## Local development

Frontend:
```bash
cd frontend
npm install
cp .env.local.example .env.local     # fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm run dev                           # http://localhost:3000
```

Batch worker (needs WeasyPrint's native libs — see below):
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                  # fill in Supabase + Groq
python run_batch.py                   # processes anything with processed = false
```
> WeasyPrint native libs, Debian/Ubuntu:
> `sudo apt install libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 libffi-dev libcairo2`.
> macOS: `brew install pango`. On Windows it's fiddly — easiest is to let GitHub
> Actions run the batch and only run the frontend locally.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Submit returns 500 "Server is not configured" | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` not set in Vercel. Add them, redeploy. |
| Submit returns 502 | The service_role key or URL is wrong, or the `responses` table doesn't exist (run `schema.sql`). |
| Row saves but never gets scored | The GitHub Action isn't running: check the three secrets, and that Actions are enabled. Trigger it manually. |
| Workflow fails at "Run batch analysis" | Open the run's logs. Usually a wrong Supabase key/URL or a retired `GROQ_MODEL`. |
| PDF summary is generic | `GROQ_API_KEY` missing → the LLM step falls back; the PDF still generates. |
| `pdf_url` link expired | It's a signed URL (default ~1 year). Re-run the workflow for that row, or lengthen `SIGNED_URL_TTL`. |

---

## Tuning

- **`RUSH_THRESHOLD_MS`** (GitHub Actions *variable*, default 1500) — after ~20–30
  real submissions, inspect the `answers[].ms` values and set this below a genuine
  answering pace.
- **Batch frequency** — edit the `cron:` in `.github/workflows/batch-analysis.yml`
  (e.g. `*/10 * * * *` for every 10 min).

---

## Cost & the one free-tier caveat

Everything above is free with no card. The single thing to know: **a free Supabase
project pauses after ~1 week of no activity** (data is safe — you click to unpause).
For a recruitment drive that runs in bursts, just open the dashboard before you
send the link out. Exact quotas shift, so glance at current limits before launch.
