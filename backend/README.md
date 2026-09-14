# backend — SUSC EMR batch worker

The scheduled analysis job for the SUSC EMR pre-interview assessment. It is **not
a running server** — it's a Python script (`run_batch.py`) run by GitHub Actions
on a schedule. It pulls unprocessed submissions from Supabase, scores them,
generates the AI narrative + one-page PDF, uploads the PDF to Supabase Storage,
and writes the results row.

> Candidate submissions are handled by the Vercel app (`../frontend`) via its
> `/api/submit` route, which inserts directly into Supabase. This worker only
> does the back-office analysis.

## Modules

```
run_batch.py         entry point — the scheduled job
config.py            env loading, constants, trait metadata, buckets
scoring.py           reverse-coding, trait means, attention & rush flags
llm.py               Groq call (fit summary + Section C consistency), JSON output
pdf_generator.py     context builder + WeasyPrint render
templates/report.html  one-A4-page candidate summary (reading-track Big Five bars)
supabase_client.py   read work queue, upload PDFs, write results, mark processed
items_config.json    Section B item definitions (shared source of truth)
```

## Run it locally

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in Supabase + Groq
python run_batch.py
```

WeasyPrint needs native libraries (Pango/cairo). See `SETUP.md → Local development`.
On Windows this is fiddly — easiest is to let GitHub Actions run the batch.

## Full setup

See [`SETUP.md`](SETUP.md) — Supabase, Groq, Vercel, and the GitHub Actions
workflow, end to end, no credit card.

## Scoring

- Trait score = mean of the trait's items after reverse-coding (`6 - value` for
  reverse-keyed items), bucketed Low (1–2.4) / Moderate (2.5–3.4) / High (3.5–5).
- Attention flag fails unless the check item was answered Neutral (3).
- Rush flag fails when average per-item time < `RUSH_THRESHOLD_MS`.
