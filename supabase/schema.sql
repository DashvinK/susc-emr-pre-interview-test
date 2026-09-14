-- SUSC EMR — Supabase schema.
-- Run this once in your Supabase project: Dashboard → SQL Editor → paste → Run.
-- Replaces the two Google Sheets tabs (Responses / Results).

-- ── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.responses (
  submission_id  uuid primary key,
  created_at     timestamptz not null default now(),
  name           text not null,
  student_id     text not null,
  answers        jsonb not null,          -- [{ "id": "csn1", "value": 4, "ms": 3200 }, ...]
  check_position int,
  check_answer   int,
  c1 text default '',
  c2 text default '',
  c3 text default '',
  c4 text default '',
  processed      boolean not null default false
);

-- Fast lookup of the batch job's work queue.
create index if not exists responses_unprocessed_idx
  on public.responses (created_at)
  where processed = false;

create table if not exists public.results (
  submission_id  uuid primary key references public.responses(submission_id) on delete cascade,
  csn_score numeric, est_score numeric, opn_score numeric,
  ext_score numeric, agr_score numeric,
  attention_flag text,
  rush_flag text,
  fit_summary text,
  c_review text,
  pdf_path text,                          -- storage path, e.g. reports/<submission_id>.pdf
  pdf_url  text,                          -- signed URL (long expiry) for the panel
  processed_at timestamptz not null default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────
-- Enable RLS with NO policies. Anonymous/authenticated clients can therefore do
-- nothing. Both writers (the Vercel /api/submit route and the GitHub Actions
-- batch job) use the service-role key, which bypasses RLS. Nothing candidate-
-- facing ever touches these tables directly.

alter table public.responses enable row level security;
alter table public.results   enable row level security;

-- ── Storage bucket for the generated PDFs ─────────────────────────────────
-- Private bucket; the batch job uploads with the service-role key and stores a
-- signed URL in results.pdf_url for the panel.
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;
