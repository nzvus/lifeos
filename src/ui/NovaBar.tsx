/**
 * ui/NovaBar.tsx — where the energy comes from by processing level (NOVA 1
 * → 4, ADR-0012), as one thin bar: herb (unprocessed) → tomato
 * (ultra-processed), hairline for "not classified". Percentages arrive
 * computed (core/nutrition/quality-summary.ts).
 */
const TONE: Record<string, string> = {
  "1": "bg-herb",
  "2": "bg-muted",
  "3": "bg-warn",
  "4": "bg-tomato",
  unknown: "bg-hairline",
};

export function NovaBar({
  shares,
  label,
}: {
  shares: Record<string, number>;
  label: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="flex h-1.5 w-full overflow-hidden bg-hairline"
    >
      {["1", "2", "3", "4", "unknown"].map((k) =>
        (shares[k] ?? 0) > 0 ? (
          <span key={k} className={TONE[k]} style={{ width: `${shares[k]}%` }} />
        ) : null,
      )}
    </span>
  );
}
