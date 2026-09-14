"use client";

import { useState } from "react";

export interface SectionAData {
  name: string;
  studentId: string;
}

interface SectionAProps {
  data: SectionAData;
  onChange: (data: SectionAData) => void;
}

export const STUDENT_ID_RE = /^\d{8}$/;

/** Section A — identification. Name + a 8-digit Student ID. */
export default function SectionA({ data, onChange }: SectionAProps) {
  const [idTouched, setIdTouched] = useState(false);

  // Keep only digits, max 8.
  function handleId(value: string) {
    onChange({ ...data, studentId: value.replace(/\D/g, "").slice(0, 8) });
  }

  const idInvalid = data.studentId.length > 0 && !STUDENT_ID_RE.test(data.studentId);
  const showIdError = idTouched && idInvalid;

  return (
    <div>
      <h2 className="text-2xl mb-1.5">Let&apos;s start with who you are</h2>
      <p className="text-sm mb-8" style={{ color: "var(--fg-2)" }}>
        Two quick details so we can match your responses to your application.
      </p>

      <div className="space-y-6 max-w-md">
        <div className="field">
          <label htmlFor="name" className="block text-sm mb-2">
            Full name
          </label>
          <input
            id="name"
            className="input-text"
            type="text"
            autoComplete="name"
            placeholder="e.g. Azman Kamarulzaman"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="studentId" className="block text-sm mb-2">
            Student ID
          </label>
          <input
            id="studentId"
            className="input-text"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            placeholder="e.g. 21045678"
            value={data.studentId}
            onChange={(e) => handleId(e.target.value)}
            onBlur={() => setIdTouched(true)}
            aria-invalid={showIdError}
            aria-describedby="studentId-hint"
          />
          <p
            id="studentId-hint"
            className="text-xs mt-1.5"
            style={{ color: showIdError ? "var(--flag-fg)" : "var(--fg-2)" }}
          >
            {showIdError ? "Student ID must be exactly 8 digits." : "8 digits."}
          </p>
        </div>
      </div>
    </div>
  );
}
