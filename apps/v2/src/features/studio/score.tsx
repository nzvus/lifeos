/**
 * Visual study, round 2 of «il voto» (ledger UI-75, dossiers/visual.md §3.4).
 * The developer, 30 Oct: «mi piace sia lo skyline, e anche 2, visivamente, ma
 * a livello informativo meglio 1 e 3, una combinazione?». One combination:
 * closed, the number with its word and the skyline without a frame, each
 * column coloured by its own band (the ruler's zones, 2), and under the head
 * one line: what to do when the app knows it (3), else the part that cost most
 * (1). Open, the skyline grows to the box's width on its bands 40 and 70, each
 * column named. Local study only; the kit takes it if he picks it.
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
export type ScorePart = { name: string; score: number; weight: number };

const WORD = { met: "bene", part: "così così", no: "male", none: "" } as const;
const band = (v: number) =>
  v >= MET ? "var(--heat-good)" : v >= PART ? "var(--heat-fair)" : "var(--heat-bad)";

export const SCORE_CSS = `
.st-vh{display:inline-flex;align-items:center;gap:8px}
.st-vh .n{display:flex;flex-direction:column;align-items:flex-end;line-height:1}
.st-vh .n b{font-family:var(--font-display);font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}
.st-vh .n small{font-size:11px;color:var(--muted);margin-top:2px}
.st-sky{position:relative;display:flex;align-items:flex-end;gap:2px;width:48px;height:22px}
.st-sky .col{position:relative;height:100%;min-width:0;border-radius:2px 2px 0 0;background:color-mix(in srgb,var(--ink) 7%,transparent)}
.st-sky .fill{position:absolute;left:0;right:0;bottom:0;border-radius:2px 2px 0 0}
.st-sky .ln{position:absolute;left:0;right:0;border-top:1px dashed color-mix(in srgb,var(--ink) 40%,transparent)}
.st-say{display:flex;align-items:baseline;gap:6px;font-size:var(--fs-b2)}
.st-say .k-meta{font-size:var(--fs-b2)}
`;

/** Closed: the number, its word, the skyline coloured by band; no frame. */
export function ScoreHead({ s, parts }: { s: ScoreSay; parts: ScorePart[] }) {
  const j = F.judge(s.value);
  return (
    <span
      className="st-vh"
      role="img"
      aria-label={
        "voto " +
        s.value +
        ", " +
        WORD[j.level] +
        ": " +
        parts.map((q) => q.name + " " + Math.round(q.score * 100)).join(", ")
      }
    >
      <span className="st-sky" aria-hidden="true">
        {parts.map((q) => (
          <span key={q.name} className="col" style={{ flexGrow: q.weight }}>
            <span
              className="fill"
              style={{
                height: Math.round(q.score * 100) + "%",
                background: band(q.score * 100),
              }}
            />
          </span>
        ))}
        <span className="ln" style={{ bottom: MET + "%" }} />
      </span>
      <span className="n" aria-hidden="true">
        <b style={{ color: j.tone }}>{s.value}</b>
        <small>{WORD[j.level]}</small>
      </span>
    </span>
  );
}

/** The line under the head: the action when known, else what cost most. */
export function ScoreLine({ s }: { s: ScoreSay }) {
  const j = F.judge(s.value);
  return (
    <span className="st-say">
      <span className={j.cls} role="img" aria-label={j.aria} />
      {s.action ? (
        <span className="k-body">{s.action}</span>
      ) : s.low ? (
        <span className="k-meta">
          è costata di più: {s.low.name} ({s.low.v})
        </span>
      ) : null}
    </span>
  );
}

/**
 * Open (round 3; round 2's wide skyline: «aperto fa un po' schifo»): one row per
 * criterion with the nutrients' own ruler (S12) — the fill to its score, the
 * bands 40 and 70 under it, the tip in its band's colour — its weight and its
 * number; the skyline stays small in the head.
 */
export function ScoreOpen({ parts }: { parts: ScorePart[] }) {
  return (
    <span className="k-stack g3">
      {parts.map((q) => {
        const v = Math.round(q.score * 100);
        const j = F.judge(v);
        return (
          <span key={q.name} className="k-stack g1">
            <span className="k-line base between">
              <span className="k-line base g1">
                <span className={j.cls} role="img" aria-label={j.aria} />
                <span className="k-body">{q.name}</span>
                <span className="k-help">pesa {Math.round(q.weight * 100)} %</span>
              </span>
              <span className="k-num b2">{v}</span>
            </span>
            <span
              className="k-bar zoned"
              role="img"
              aria-label={q.name + " " + v + " su 100"}
            >
              <i style={{ width: v + "%", "--mix": "60%" } as CSSProperties} />
              <span
                className="k-ztip"
                aria-hidden="true"
                style={{ left: v + "%", background: band(v) }}
              />
              <span className="k-zrule" aria-hidden="true">
                <span
                  className="z fair"
                  style={{ left: PART + "%", width: MET - PART + "%" }}
                />
                <span
                  className="z good"
                  style={{ left: MET + "%", width: 100 - MET + "%" }}
                />
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
      })}
    </span>
  );
}
