/**
 * Visual study, choice «il voto» (dossiers/visual.md §3.1, ledger UI-74): three
 * rethought ways to say a box's score, beside what v2 draws today (the framed
 * skyline chip in Box). Local study only (app/(app)/studio); the one the
 * developer picks moves into the kit, the others are deleted.
 */
import type { CSSProperties } from "react";
import { F, MET, PART } from "@lifeos/kit";

export type ScoreSay = {
  value: number;
  /** The part that cost the most points (weight × what it missed), its words and its 0–100. */
  low: { name: string; v: number } | null;
  /** What would raise it, in words of the day (or null). */
  action: string | null;
};

const LEVEL_WORDS = { met: "bene", part: "così così", no: "male", none: "" } as const;

/** 1 · The sentence: no chart, the score's word and the reason it is not more. */
export function ScoreSentence({ s }: { s: ScoreSay }) {
  const j = F.judge(s.value);
  return (
    <span className="k-line base g1 wrap">
      <span className={j.cls} role="img" aria-label={j.aria} />
      <span className="k-num b2">{s.value}</span>
      <span className="k-label b2">{LEVEL_WORDS[j.level]}</span>
      {s.low && (
        <span className="k-meta">
          · è costata di più: {s.low.name} ({s.low.v})
        </span>
      )}
    </span>
  );
}

/** 2 · The ruler: the score as a value against its bands, the same form as a nutrient's zones. */
export function ScoreRuler({ s }: { s: ScoreSay }) {
  const tip =
    s.value >= MET
      ? "var(--heat-good)"
      : s.value >= PART
        ? "var(--heat-fair)"
        : "var(--heat-bad)";
  return (
    <span className="k-stack g1">
      <span className="k-line base between">
        <span className="k-meta">voto</span>
        <span className="k-num b2">{s.value} / 100</span>
      </span>
      <span className="k-bar zoned" role="img" aria-label={"voto " + s.value + " su 100"}>
        <i style={{ width: s.value + "%", "--mix": "60%" } as CSSProperties} />
        <span
          className="k-ztip"
          aria-hidden="true"
          style={{ left: s.value + "%", background: tip }}
        />
        <span className="k-zrule" aria-hidden="true">
          <span
            className="z fair"
            style={{ left: PART + "%", width: MET - PART + "%" }}
          />
          <span className="z good" style={{ left: MET + "%", width: 100 - MET + "%" }} />
          <span className="tk" style={{ left: PART + "%" }}>
            <span>{PART}</span>
          </span>
          <span className="tk" style={{ left: MET + "%" }}>
            <span>{MET}</span>
          </span>
        </span>
      </span>
    </span>
  );
}

/** 3 · What to do: the score turned into the one thing that would raise it. */
export function ScoreAction({ s }: { s: ScoreSay }) {
  const j = F.judge(s.value);
  return (
    <span className="k-line base g2 wrap">
      <span className="k-num b2" style={{ color: j.tone }}>
        {s.value}
      </span>
      <span className="k-body">
        {s.action ?? (s.low ? "è costata di più: " + s.low.name : "")}
      </span>
    </span>
  );
}
