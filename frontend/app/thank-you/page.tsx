/** Thank-you page — shown after a successful submission. */
export default function ThankYou() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="mx-auto w-full max-w-form px-6 py-24 flex-1 flex flex-col justify-center">
        <div
          className="badge badge-pass mb-6"
          style={{ alignSelf: "flex-start" }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 8.5l3.2 3.2L13 5" />
          </svg>
          Submitted
        </div>

        <h1 className="text-4xl leading-tight">Thanks — that&apos;s all we need.</h1>
        <p className="mt-5 text-base sm:text-lg" style={{ color: "var(--fg-2)" }}>
          Your responses are in. The panel will have them ahead of your interview,
          and we&apos;ll talk some of it through when we meet. There&apos;s nothing
          more to do here — you can close this tab.
        </p>

        <p className="mt-10 mono text-xs" style={{ color: "var(--fg-2)" }}>
          SUSC EMR · Sunway University Student Council
        </p>
      </div>
    </main>
  );
}
