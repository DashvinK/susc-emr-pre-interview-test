import { z } from "zod";

// Server-side validation for POST /api/submit. Mirrors the old FastAPI Pydantic
// schema so the integrity checks live on the server, not the client.
export const SubmissionSchema = z.object({
  submission_id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  student_id: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Student ID must be exactly 6 digits"),
  answers: z
    .array(
      z.object({
        id: z.string().min(1).max(32),
        value: z.number().int().min(1).max(5),
        ms: z.number().int().min(0),
      })
    )
    .min(1)
    .max(20),
  check_position: z.number().int().min(0).max(20),
  check_answer: z.number().int().min(1).max(5).nullable(),
  written: z.object({
    c1: z.string().max(4000).default(""),
    c2: z.string().max(4000).default(""),
    c3: z.string().max(4000).default(""),
    c4: z.string().max(4000).default(""),
  }),
});

export type ValidatedSubmission = z.infer<typeof SubmissionSchema>;
