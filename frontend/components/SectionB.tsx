"use client";

import { useRef } from "react";
import type { Item } from "@/lib/types";
import LikertItem from "./LikertItem";

interface SectionBProps {
  /** Ordered display items (15 scored + attention-check at its random position). */
  items: Item[];
  /** Current answers keyed by item id (includes "check1"). */
  answers: Record<string, number>;
  /** Called with the item id, chosen value, and ms since the previous answer. */
  onAnswer: (id: string, value: number, ms: number) => void;
}

/**
 * Section B — the personality test. Renders the ordered reading-track items and
 * records per-item response time (ms between consecutive answers), mirroring the
 * dataset's `_E` timing fields used for the backend's rush-detection flag.
 */
export default function SectionB({ items, answers, onAnswer }: SectionBProps) {
  // Timestamp of the previous answer (or first interaction). Persists across renders.
  const lastTime = useRef<number>(Date.now());

  function handleAnswer(id: string, value: number) {
    const now = Date.now();
    const ms = now - lastTime.current;
    lastTime.current = now;
    onAnswer(id, value, ms);
  }

  const answeredCount = items.filter((it) => answers[it.id] != null).length;

  return (
    <div>
      <h2 className="text-2xl mb-1.5">Personality test</h2>
      <p className="text-sm mb-2" style={{ color: "var(--fg-2)" }}>
        A few statements about how you work and respond under pressure. Answer
        honestly — there are no right answers.
      </p>
      <p className="mono text-xs mb-8" style={{ color: "var(--fg-2)" }}>
        {answeredCount} / {items.length} answered
      </p>

      <ol className="space-y-4">
        {items.map((item, idx) => (
          <LikertItem
            key={item.id}
            number={idx + 1}
            text={item.text}
            value={answers[item.id] ?? null}
            onChange={(value) => handleAnswer(item.id, value)}
          />
        ))}
      </ol>
    </div>
  );
}
