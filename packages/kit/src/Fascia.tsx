/**
 * Fascia and Judge (PAT-52, UI-102): the one ruler under a bar and the one judgement chip.
 *
 * `Fascia` — a number's zones as a ruler under its own bar (`.k-bar.zoned`): the bar still says
 * how much, its tip takes the colour of the zone it ends in, and the ruler shows every zone — the
 * right one green, the near ones yellow — with the amount at each change. Nutrients' bars and a
 * score's parts draw it the same way. `scoreFascia` is the ruler of a 0–100 score (40 · 70).
 *
 * `Judge` — mark + number + word, the same everywhere a number is judged (`F.judge`).
 */
import type { CSSProperties } from "react";
import { F, MET, PART } from "./format";
import type { HeatStrip } from "./nutrient-rows";

export type FasciaRuler = Pick<HeatStrip, "rule" | "ticks" | "tip" | "at" | "to">;

export function Fascia({ strip }: { strip: FasciaRuler }) {
  return (
    <>
      {strip.tip && (
        <span
          className="k-ztip"
          aria-hidden="true"
          style={{ left: strip.to ?? strip.at, background: strip.tip }}
        />
      )}
      <span className="k-zrule" aria-hidden="true">
        {strip.rule.map((r, i) => (
          <span key={i} className={"z " + r.level} style={{ left: r.left, width: r.w }} />
        ))}
        {strip.ticks.map((t, i) => (
          <span key={"t" + i} className="tk" style={{ left: t.at }}>
            {t.label && <span>{t.label}</span>}
          </span>
        ))}
      </span>
    </>
  );
}

const heat = (v: number) =>
  v >= MET ? "var(--heat-good)" : v >= PART ? "var(--heat-fair)" : "var(--heat-bad)";

/** The ruler of a score out of 100: «in parte» from 40, «raggiunto» from 70. */
export function scoreFascia(v: number): FasciaRuler {
  return {
    at: v + "%",
    to: null,
    tip: heat(v),
    rule: [
      { left: PART + "%", w: MET - PART + "%", level: "fair" },
      { left: MET + "%", w: 100 - MET + "%", level: "good" },
    ],
    ticks: [
      { at: PART + "%", label: String(PART) },
      { at: MET + "%", label: String(MET) },
    ],
  };
}

/** A score out of 100 as its bar with the ruler under it (a score's parts, PAT-52). */
export function FasciaBar({ score, label }: { score: number; label: string }) {
  return (
    <span className="k-bar zoned" role="img" aria-label={label}>
      <i style={{ width: score + "%", "--mix": "60%" } as CSSProperties} />
      <Fascia strip={scoreFascia(score)} />
    </span>
  );
}

/** Mark + number + word: one judged number (a score out of 100, or `shown` beside it). */
export function Judge({
  score,
  shown,
}: {
  score: number | null | undefined;
  shown?: string;
}) {
  const j = F.judge(score);
  return (
    <span className="k-judge">
      <span className={j.cls} role="img" aria-label={j.aria} />
      <b className="k-num b2">
        {shown ?? (score === null || score === undefined ? "—" : Math.round(score))}
      </b>
      {j.label && <span className="k-meta">{j.label}</span>}
    </span>
  );
}
