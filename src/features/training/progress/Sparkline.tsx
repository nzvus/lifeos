/**
 * features/training/progress/Sparkline.tsx — a small trend line (tonnage per
 * routine run, e1RM per session), oldest first, scaled to its own min–max;
 * the last point is a dot. Fewer than two points: nothing. Colour from the
 * surrounding text (pass a text-* class).
 */
export function Sparkline({
  values,
  className = "text-herb",
}: {
  values: readonly number[];
  className?: string;
}) {
  if (values.length < 2) return null;
  const W = 72;
  const H = 24;
  const pad = 3;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (W - 2 * pad),
    H - pad - ((v - min) / span) * (H - 2 * pad),
  ]);
  const last = pts.at(-1)!;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={3} fill="currentColor" />
    </svg>
  );
}
