# frontend — SUSC EMR

Candidate-facing form for the SUSC EMR pre-interview assessment. Next.js (App
Router) + Tailwind, deployed to Vercel. Talks only to the FastAPI backend
(`../backend`) via `POST /submit`; it never touches Google Sheets directly.

## Design system

Tokens and the "reading track" signature come from
`../docs/design/brand-kit-refined.html`. Key rule: **navy** = action/structure,
**gold-500** = signal (progress fill only), **gold-700** = the single interactive
gold (focus rings, selected states). Light/dark follow the system setting — no
in-app appearance toggle.

## Local development

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm run dev                        # http://localhost:3000
```

## Structure

```
app/
  layout.tsx          # fonts (Fraunces / IBM Plex Sans / IBM Plex Mono), metadata
  globals.css         # design tokens (light+dark) + reading-track component classes
  page.tsx            # landing / intro
  test/page.tsx       # 3-step stepper (state, validation, timing, submit)
  thank-you/page.tsx
components/
  ReadingTrack.tsx    # the 5-point Likert control (44pt targets, arrow keys)
  LikertItem.tsx      # statement + ReadingTrack
  SectionA.tsx        # name + student ID
  SectionB.tsx        # ordered items + per-item timing
  SectionC.tsx        # 4 written answers + soft word counters
  ProgressBar.tsx     # reading-track progress rail
lib/
  itemsConfig.ts      # 15 scored items + attention-check + display-order helpers
  api.ts              # POST /submit
  types.ts            # shared payload types
```

## Notes

- The attention-check item is injected client-side at a random index (3–12) and
  sent separately as `check_position` / `check_answer`; it is excluded from the
  scored `answers` array.
- Per-item response time (`ms`) is the gap between consecutive answers, feeding
  the backend's rush-detection flag.
- No save-and-resume by design (short completion time); a `beforeunload` guard
  warns on accidental navigation.

## Deploy (Vercel)

1. Import this repo into Vercel.
2. Set `NEXT_PUBLIC_API_BASE_URL` in the project's environment variables.
3. Deploy. (No cron here — the batch trigger runs on the Oracle backend.)
