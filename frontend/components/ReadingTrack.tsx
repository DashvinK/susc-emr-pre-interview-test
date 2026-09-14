"use client";

import { SCALE_ENDS } from "@/lib/itemsConfig";

interface ReadingTrackProps {
  /** Accessible name for the radio group (the statement text). */
  ariaLabel: string;
  /** Current value 1..5, or null if unanswered. */
  value: number | null;
  onChange: (value: number) => void;
}

const VALUE_LABELS: Record<number, string> = {
  1: "1, Disagree",
  2: "2",
  3: "3, Neutral",
  4: "4",
  5: "5, Agree",
};

/**
 * The "reading track" — the signature 5-point control. Real radios with 44pt hit
 * targets; the selected node is filled (gold-700 on light) so selection reads by
 * shape as well as color. Arrow keys move between options.
 */
export default function ReadingTrack({ ariaLabel, value, onChange }: ReadingTrackProps) {
  const values = [1, 2, 3, 4, 5];

  function handleKey(e: React.KeyboardEvent, current: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.min(current + 1, 5));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.max(current - 1, 1));
    }
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <span className="rt-end" aria-hidden="true">
        {SCALE_ENDS.left}
      </span>
      <div className="rt-track" role="radiogroup" aria-label={ariaLabel}>
        {values.map((v) => {
          const checked = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={VALUE_LABELS[v]}
              className="rt-node"
              // Roving tabindex: focus lands on the selected node, else the first.
              tabIndex={checked || (value === null && v === 1) ? 0 : -1}
              onClick={() => onChange(v)}
              onKeyDown={(e) => handleKey(e, v)}
            >
              <span className="rt-dot" />
              <span className="rt-vlabel" aria-hidden="true">
                {v}
              </span>
            </button>
          );
        })}
      </div>
      <span className="rt-end text-right" aria-hidden="true">
        {SCALE_ENDS.right}
      </span>
    </div>
  );
}
