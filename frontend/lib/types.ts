// Shared types for the SUSC EMR candidate form.

export type TraitCode = "CSN" | "EST" | "OPN" | "EXT" | "AGR";

export interface Item {
  id: string;
  trait: TraitCode;
  reverse: boolean;
  text: string;
}

/** A single scored answer, sent to the backend. */
export interface Answer {
  id: string;
  value: number; // 1..5
  ms: number; // time since previous answer, per-item timing
}

export interface WrittenAnswers {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
}

/** POST /submit request body (see build spec §7). */
export interface SubmissionPayload {
  submission_id: string;
  name: string;
  student_id: string;
  answers: Answer[];
  check_position: number;
  check_answer: number | null;
  written: WrittenAnswers;
}

export interface SubmitResponse {
  status: string;
  submission_id: string;
}
