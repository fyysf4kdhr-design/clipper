export function scoreColor(score: number): string {
  if (score >= 90) return "#C8FF2E";
  if (score >= 75) return "#FFD52E";
  return "#FF7A2E";
}

export default function ScoreDial({
  score,
  size = 64,
  stroke = 5,
  showLabel = false,
}: {
  score: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="sdg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C8FF2E" />
            <stop offset="100%" stopColor="#6EE7FF" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(237,237,230,0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#sdg)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)",
            filter: "drop-shadow(0 0 6px rgba(110,231,255,0.45))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-semibold leading-none"
          style={{ fontSize: size * 0.3, color }}
        >
          {score}
        </span>
        {showLabel && (
          <span className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-mute">
            viral
          </span>
        )}
      </div>
    </div>
  );
}
