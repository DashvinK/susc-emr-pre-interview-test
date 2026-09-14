"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import SectionA, { type SectionAData, STUDENT_ID_RE } from "@/components/SectionA";
import SectionB from "@/components/SectionB";
import SectionC from "@/components/SectionC";
import { buildDisplayOrder, randomCheckPosition, SCORED_ITEMS } from "@/lib/itemsConfig";
import { newSubmissionId, submitAssessment } from "@/lib/api";
import type { Answer, WrittenAnswers } from "@/lib/types";

const STEPS = ["Identification", "Personality", "Written"] as const;
const SCORED_IDS = new Set(SCORED_ITEMS.map((i) => i.id));

export default function TestPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [sectionA, setSectionA] = useState<SectionAData>({ name: "", studentId: "" });

  // Attention-check position is chosen once, on mount, and stays fixed for this session.
  const [checkPosition] = useState(() => randomCheckPosition());
  const displayItems = useMemo(
    () => buildDisplayOrder(checkPosition).items,
    [checkPosition]
  );

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timings, setTimings] = useState<Record<string, number>>({});
  const [written, setWritten] = useState<WrittenAnswers>({ c1: "", c2: "", c3: "", c4: "" });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Warn before leaving once the candidate has started (no save-and-resume).
  const started = sectionA.name !== "" || Object.keys(answers).length > 0;
  useEffect(() => {
    if (!started) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started]);

  function handleAnswer(id: string, value: number, ms: number) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setTimings((prev) => ({ ...prev, [id]: ms }));
  }

  // Per-step validation — the Continue/Submit button is disabled until it passes.
  const stepValid = useMemo(() => {
    if (step === 1) {
      return sectionA.name.trim() !== "" && STUDENT_ID_RE.test(sectionA.studentId.trim());
    }
    if (step === 2) {
      return displayItems.every((it) => answers[it.id] != null);
    }
    // step 3
    return (["c1", "c2", "c3", "c4"] as const).every((k) => written[k].trim() !== "");
  }, [step, sectionA, displayItems, answers, written]);

  function goTo(next: number) {
    setStep(next);
    setError(null);
    // Scroll back to the top of the form on step change.
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const scored: Answer[] = displayItems
        .filter((it) => SCORED_IDS.has(it.id))
        .map((it) => ({ id: it.id, value: answers[it.id], ms: timings[it.id] ?? 0 }));

      await submitAssessment({
        submission_id: newSubmissionId(),
        name: sectionA.name.trim(),
        student_id: sectionA.studentId.trim(),
        answers: scored,
        check_position: checkPosition,
        check_answer: answers["check1"] ?? null,
        written,
      });

      // Clear the beforeunload guard, then move on.
      router.push("/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div ref={topRef} className="mx-auto w-full max-w-form px-6 pt-10">
        <ProgressBar step={step} totalSteps={STEPS.length} label={STEPS[step - 1]} />
      </div>

      <div className="mx-auto w-full max-w-form px-6 py-10 flex-1">
        {step === 1 && <SectionA data={sectionA} onChange={setSectionA} />}
        {step === 2 && (
          <SectionB items={displayItems} answers={answers} onAnswer={handleAnswer} />
        )}
        {step === 3 && <SectionC data={written} onChange={setWritten} />}

        {error && (
          <div
            className="mt-8 badge badge-flag"
            role="alert"
            style={{ display: "flex" }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Sticky action bar keeps the primary action reachable on phone and laptop. */}
      <div
        className="sticky bottom-0"
        style={{
          background: "var(--bg)",
          borderTop: "1px solid var(--line)",
        }}
      >
        <div className="mx-auto w-full max-w-form px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => goTo(step - 1)}
            disabled={step === 1 || submitting}
          >
            Back
          </button>

          {step < STEPS.length ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => goTo(step + 1)}
              disabled={!stepValid}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!stepValid || submitting}
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
