import type { Item } from "./types";

// Section B scored items — mirrors the backend's items_config.json (build spec §5).
// `reverse: true` means the backend scores the response as (6 - value).
// The attention-check item is NOT in this list; it is injected client-side at a
// random position (see buildDisplayOrder) and tagged separately as "check1".
export const SCORED_ITEMS: Item[] = [
  { id: "csn1", trait: "CSN", reverse: false, text: "I follow through on tasks I commit to for SUSC, even when no one is checking up on me." },
  { id: "csn2", trait: "CSN", reverse: false, text: "I pay close attention to detail when preparing for events or tasks." },
  { id: "csn3", trait: "CSN", reverse: true, text: "I sometimes leave things until the last minute." },
  { id: "csn4", trait: "CSN", reverse: false, text: "I get things done and submitted on time." },
  { id: "csn5", trait: "CSN", reverse: true, text: "I often forget to follow up on things I said I'd do." },
  { id: "est1", trait: "EST", reverse: false, text: "A failed event or rejected idea doesn't stop me from trying again." },
  { id: "est2", trait: "EST", reverse: true, text: "I get stressed out easily when things don't go as planned." },
  { id: "est3", trait: "EST", reverse: true, text: "I take setbacks personally and it affects my mood for a while." },
  { id: "est4", trait: "EST", reverse: false, text: "I stay calm even when there's a lot of pressure before an event." },
  { id: "opn1", trait: "OPN", reverse: false, text: "I actively look for ways to learn and improve, even outside my comfort zone." },
  { id: "opn2", trait: "OPN", reverse: false, text: "I enjoy tackling problems I haven't dealt with before." },
  { id: "opn3", trait: "OPN", reverse: true, text: "I prefer sticking to familiar tasks rather than trying new approaches." },
  { id: "opn4", trait: "OPN", reverse: false, text: "I have plenty of ideas for how things could be done better." },
  { id: "ext1", trait: "EXT", reverse: false, text: "I'm comfortable speaking up and taking the lead in group settings." },
  { id: "agr1", trait: "AGR", reverse: false, text: "I make people around me feel comfortable working with me." },
];

// The unscored attention-check item. Injected at a random index per candidate so
// the correct answer can't be pattern-shared. Correct response = Neutral (3).
export const CHECK_ITEM: Item = {
  id: "check1",
  trait: "CSN", // unused; excluded from scoring by the backend on id === "check1"
  reverse: false,
  text: 'To show you\'re reading carefully, please select "Neutral" for this statement.',
};

export const CHECK_CORRECT_VALUE = 3;

// 5-point scale anchors.
export const SCALE_MIN = 1;
export const SCALE_MAX = 5;
export const SCALE_ENDS = { left: "Disagree", right: "Agree" } as const;

/**
 * Build the display order for Section B: the 15 scored items in fixed order with
 * the attention-check item inserted at `checkPosition`. Returns the ordered list
 * plus the chosen position.
 */
export function buildDisplayOrder(checkPosition: number): {
  items: Item[];
  checkPosition: number;
} {
  const items = [...SCORED_ITEMS];
  const pos = Math.min(Math.max(checkPosition, 0), items.length);
  items.splice(pos, 0, CHECK_ITEM);
  return { items, checkPosition: pos };
}

/**
 * Random insertion index for the attention-check item. Kept away from the very
 * first/last rows (safe range 3–12 of the 16 total) so it reads naturally.
 */
export function randomCheckPosition(): number {
  const min = 3;
  const max = 12;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
