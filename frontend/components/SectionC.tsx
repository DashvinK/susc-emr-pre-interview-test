"use client";

import type { WrittenAnswers } from "@/lib/types";

interface SectionCProps {
  data: WrittenAnswers;
  onChange: (data: WrittenAnswers) => void;
}

const QUESTIONS: { key: keyof WrittenAnswers; text: string }[] = [
  {
    key: "c1",
    text: "Describe a time you failed or fell short at something. What happened, and what did you take from it?",
  },
  {
    key: "c2",
    text: "Tell us about a task or problem you took ownership of without being asked.",
  },
  {
    key: "c3",
    text: "How do you typically respond to critical feedback on your work?",
  },
  {
    key: "c4",
    text: "What's one area you want to grow in this year, and how do you see SUSC helping with that?",
  },
];

const SOFT_LIMIT = 150;

function wordCount(s: string): number {
  const t = s.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

/** Section C — four short written answers with soft (non-blocking) word counters. */
export default function SectionC({ data, onChange }: SectionCProps) {
  return (
    <div>
      <h2 className="text-2xl mb-1.5">A few words in your own voice</h2>
      <p className="text-sm mb-8" style={{ color: "var(--fg-2)" }}>
        Around {SOFT_LIMIT} words each is plenty — the counter is a guide, not a
        cut-off.
      </p>

      <ol className="space-y-8">
        {QUESTIONS.map((q, idx) => {
          const value = data[q.key];
          const count = wordCount(value);
          const over = count > SOFT_LIMIT;
          const fieldId = `written-${q.key}`;
          return (
            <li key={q.key} className="list-none">
              <label htmlFor={fieldId} className="flex gap-2.5 mb-3">
                <span className="mono text-[0.9rem] pt-0.5" style={{ color: "var(--accent)" }}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[1rem] leading-snug">{q.text}</span>
              </label>
              <textarea
                id={fieldId}
                className="input-text"
                rows={5}
                style={{ resize: "vertical" }}
                value={value}
                onChange={(e) => onChange({ ...data, [q.key]: e.target.value })}
              />
              <div
                className="mono text-xs mt-1.5 text-right"
                style={{ color: over ? "var(--flag-fg)" : "var(--fg-2)" }}
              >
                {count} / {SOFT_LIMIT} words
                {over ? " · a little long, but that's OK" : ""}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
