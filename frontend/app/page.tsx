import Link from "next/link";

/** Landing / intro page. Teaches through use — no sign-in, straight to the point. */
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="mx-auto w-full max-w-form px-6 py-16 sm:py-24 flex-1 flex flex-col justify-center">
        <p className="kicker mb-3">SUSC Exec Recruitment</p>
        <h1 className="text-4xl sm:text-5xl leading-tight">
          Pre-interview assessment
        </h1>
        <p className="mt-5 text-base sm:text-lg" style={{ color: "var(--fg-2)" }}>
          Thanks for being shortlisted. This is a short assessment we&apos;ll talk
          through together at your interview. It takes most people{" "}
          <span className="mono">8–12 minutes</span>.
        </p>

        <p
          className="mt-6 text-sm pl-4"
          style={{ color: "var(--fg-2)", borderLeft: "2px solid var(--accent)" }}
        >
          There are no right or wrong answers, and this isn&apos;t a pass-or-fail
          test — it just helps us get to know you a little before we meet. Please
          answer as honestly as you can.
        </p>

        <ol className="mt-10 space-y-5">
          <Step n="01" title="Who you are" body="Your name and student ID." />
          <Step
            n="02"
            title="Personality test"
            body="16 short statements about how you work and respond under pressure. There are no right answers — answer honestly."
          />
          <Step
            n="03"
            title="A few words"
            body="Four brief written questions in your own voice."
          />
        </ol>

        <div className="mt-12">
          <Link href="/test" className="btn btn-primary">
            Get started
          </Link>
          <p className="mt-4 text-sm" style={{ color: "var(--fg-2)" }}>
            Set aside a few uninterrupted minutes — there&apos;s no save-and-resume,
            so it&apos;s best done in one sitting.
          </p>
        </div>
      </div>

      <footer className="mx-auto w-full max-w-form px-6 py-8 text-xs" style={{ color: "var(--fg-2)" }}>
        <span className="mono">SUSC EMR</span> · Sunway University Student Council
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-4 list-none">
      <span className="mono text-sm pt-0.5" style={{ color: "var(--accent)" }}>
        {n}
      </span>
      <div>
        <h3 className="text-lg">{title}</h3>
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-2)" }}>
          {body}
        </p>
      </div>
    </li>
  );
}
