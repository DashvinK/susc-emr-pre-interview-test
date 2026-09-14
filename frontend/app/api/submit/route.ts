import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SubmissionSchema } from "@/lib/validation";

// Runs as a Node serverless function on Vercel (needs the service-role key, which
// must never reach the browser). Same-origin, so no CORS.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accept the bare project URL even if someone pasted the REST endpoint or a
// trailing slash (https://ref.supabase.co/rest/v1 → https://ref.supabase.co).
function normalizeSupabaseUrl(u: string): string {
  return u
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "")
    .replace(/\/+$/, "");
}

export async function POST(request: Request) {
  const rawUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceKey) {
    return NextResponse.json(
      { detail: "Server is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: "Validation failed.", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const s = parsed.data;

  // Service-role client bypasses RLS; this key is server-only.
  const url = normalizeSupabaseUrl(rawUrl);
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { error } = await supabase.from("responses").insert({
      submission_id: s.submission_id,
      name: s.name,
      student_id: s.student_id,
      answers: s.answers,
      check_position: s.check_position,
      check_answer: s.check_answer,
      c1: s.written.c1,
      c2: s.written.c2,
      c3: s.written.c3,
      c4: s.written.c4,
      processed: false,
    });

    if (error) {
      // Duplicate submission_id (unique PK) — treat as already received, idempotent.
      if (error.code === "23505") {
        return NextResponse.json({ status: "received", submission_id: s.submission_id });
      }
      console.error("Supabase insert failed:", error);
      return NextResponse.json(
        { detail: "Could not save your submission. Please try again." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Supabase request threw:", err);
    return NextResponse.json(
      { detail: "Could not reach the database. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ status: "received", submission_id: s.submission_id });
}
