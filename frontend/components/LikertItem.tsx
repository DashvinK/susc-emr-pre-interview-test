"use client";

import ReadingTrack from "./ReadingTrack";

interface LikertItemProps {
  /** 1-based display number shown to the candidate. */
  number: number;
  text: string;
  value: number | null;
  onChange: (value: number) => void;
}

/**
 * A single Section B statement + its reading-track control. Timing is handled by
 * the parent (SectionB) on each answer change.
 */
export default function LikertItem({ number, text, value, onChange }: LikertItemProps) {
  return (
    <li className="surface rounded-lg p-5 sm:p-6 list-none">
      <div className="flex gap-2.5 mb-4">
        <span className="mono text-[0.9rem] pt-0.5" style={{ color: "var(--accent)" }}>
          {String(number).padStart(2, "0")}
        </span>
        <p className="text-[1rem] leading-snug">{text}</p>
      </div>
      <ReadingTrack ariaLabel={text} value={value} onChange={onChange} />
    </li>
  );
}
