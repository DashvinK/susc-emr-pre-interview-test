import type { SubmissionPayload, SubmitResponse } from "./types";

/**
 * POST the completed assessment to our own Next.js route (`/api/submit`), which
 * validates it and inserts it into Supabase. Same-origin, so no CORS and no
 * separate backend URL to configure.
 */
export async function submitAssessment(
  payload: SubmissionPayload
): Promise<SubmitResponse> {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.detail ?? "";
    } catch {
      // ignore parse errors
    }
    throw new Error(
      detail || `Submission failed (${res.status}). Please try again.`
    );
  }

  return (await res.json()) as SubmitResponse;
}

/** Client-side submission id (uuid v4 when available, with a safe fallback). */
export function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
