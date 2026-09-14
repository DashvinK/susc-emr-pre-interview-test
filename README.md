# SUSC EMR — Pre-Interview Assessment

A short web assessment completed by shortlisted SUSC candidates before their
interview: identification, a 16-item personality test, and four written answers.
Every submission feeds an AI-generated one-page PDF summary for the interview panel.

## Architecture (serverless, no credit card)

```
  Candidate ─▶ Vercel (Next.js)                         Supabase
               ├─ the form                              ┌────────────────┐
               └─ /api/submit ─── INSERT ──────────────▶│ Postgres        │
                                                        │  responses      │
  GitHub Actions ── every 20 min ──┐                    │  results        │
   backend/run_batch.py:           │  SELECT unprocessed│ Storage: reports│
   score → Groq → WeasyPrint ──────┴───────────────────▶│  (PDFs)        │
                                                        └────────────────┘
                                        Panel reads results in the Supabase dashboard
```

Nothing here requires a credit card. See [`backend/SETUP.md`](backend/SETUP.md).

## Structure

```
susc-pre-interview-assesment/
├── frontend/     # Next.js — the form + /api/submit route → Vercel
├── backend/      # Python batch worker (run_batch.py) → GitHub Actions
├── supabase/     # schema.sql (tables, RLS, storage bucket)
├── .github/workflows/batch-analysis.yml   # the scheduled batch job
└── docs/         # original plan/spec + the design system
```

## Run locally

Frontend:
```bash
cd frontend && npm install
cp .env.local.example .env.local     # SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm run dev                          # http://localhost:3000
```

Batch worker (needs WeasyPrint native libs — see backend/SETUP.md):
```bash
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run_batch.py
```

## Design

The design system (tokens, the "reading track" signature, the PDF layout) lives
in `docs/design/` — see `brand-kit-refined.html`.
