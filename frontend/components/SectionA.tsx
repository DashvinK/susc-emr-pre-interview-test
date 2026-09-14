"use client";

export interface SectionAData {
  name: string;
  studentId: string;
}

interface SectionAProps {
  data: SectionAData;
  onChange: (data: SectionAData) => void;
}

/** Section A — identification. Kept deliberately minimal: name + student ID. */
export default function SectionA({ data, onChange }: SectionAProps) {
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
            placeholder="e.g. Dashvin Naidu"
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
            placeholder="e.g. 22012345"
            value={data.studentId}
            onChange={(e) => onChange({ ...data, studentId: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
