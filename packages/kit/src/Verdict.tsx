/**
 * A verdict as tiny chevrons beside its number (his 21 Nov, §146–§148: «non frecce, ma più questi
 * >> ma capovolti»): two down red «da evitare», one down orange «pessimo», a grey dash without a
 * judgement, one up yellow «ok», two up green «ottimo» — the heat colours, the voto's too. Never
 * colour alone (VIS-20): the shape says it, its word is the label. The kit knows no type (PAT-81).
 */
import { Glyph } from "./Glyph";
import { HEAT_WORDS, type HeatLevel } from "./nutrient-rows";

const MARK: Record<HeatLevel | "none", string> = {
  danger: "twoDown",
  bad: "down",
  none: "level",
  fair: "up",
  good: "twoUp",
};

export function Verdict({ level }: { level: HeatLevel | null }) {
  const l = level ?? "none";
  return (
    <span
      className={"k-verdict " + l}
      role="img"
      aria-label={level ? HEAT_WORDS[level] : "non giudicato"}
    >
      <Glyph of={{ ui: MARK[l] }} size="xs" />
    </span>
  );
}
