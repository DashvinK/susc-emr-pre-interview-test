interface ProgressBarProps {
  step: number; // 1-based current step
  totalSteps: number;
  label: string;
}

/**
 * The reading-track progress rail. Gold-500 (signal) fill on a groove track.
 */
export default function ProgressBar({ step, totalSteps, label }: ProgressBarProps) {
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div>
      <div className="flex justify-between mono text-xs mb-2" style={{ color: "var(--fg-2)" }}>
        <span>
          Step {step} of {totalSteps} · {label}
        </span>
        <span aria-hidden="true">{pct}%</span>
      </div>
      <div
        className="rail"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${step} of ${totalSteps}: ${label}`}
      >
        <div className="rail-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
