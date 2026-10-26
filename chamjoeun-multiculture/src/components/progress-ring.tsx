export function ProgressRing({
  value,
  label,
  size = 120,
}: {
  value: number;
  label: string;
  size?: number;
}) {
  const progress = Math.max(0, Math.min(100, value)),
    radius = 44,
    circumference = 2 * Math.PI * radius;
  return (
    <div
      className="progress-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label} ${progress}%`}
    >
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} className="ring-track" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="ring-value"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div>
        <strong>
          {progress}
          <small>%</small>
        </strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
