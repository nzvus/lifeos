/**
 * A verdict as a tiny arrow beside its number (his 21 Nov, §146): ⇊ red «da evitare», ↓ orange
 * «pessimo», – grey without a judgement, ↑ yellow «ok», ⇈ green «ottimo» — his proposed colours,
 * the same the voto takes. Never colour alone (VIS-20): the arrow's shape says it, its word is the
 * label. The kit knows no type (PAT-81).
 */
import { HEAT_WORDS, type HeatLevel } from "./nutrient-rows";

const MARK: Record<HeatLevel | "none", string> = {
  danger: "⇊",
  bad: "↓",
  none: "–",
  fair: "↑",
  good: "⇈",
};

export function Verdict({ level }: { level: HeatLevel | null }) {
  const l = level ?? "none";
  return (
    <span
      className={"k-verdict " + l}
      role="img"
      aria-label={level ? HEAT_WORDS[level] : "non giudicato"}
    >
      {MARK[l]}
    </span>
  );
}
