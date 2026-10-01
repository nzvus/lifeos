/**
 * ui/Change.tsx — a whole-percent change as a coloured figure: better in
 * herb, worse in tomato, no change muted. Used by the training progress
 * lists and by each set in gym mode.
 */
/** "+12 %" in herb, "−5 %" in tomato, "0 %" muted; null renders nothing. */
export function Change({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const tone = pct > 0 ? "text-herb" : pct < 0 ? "text-tomato" : "text-muted";
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return (
    <span className={`font-display font-semibold tabular-nums ${tone}`}>
      {`${sign}${Math.abs(pct)} %`}
    </span>
  );
}
