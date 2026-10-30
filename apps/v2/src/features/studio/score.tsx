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
.st-big{display:flex;flex-direction:column;gap:6px}
.st-big .st-sky{width:100%;height:72px;gap:3px}
.st-big .zone{position:absolute;left:0;right:0;pointer-events:none}
.st-big .names{display:flex;gap:3px}
.st-big .names span{min-width:0;font-size:11px;line-height:1.2;color:var(--muted);text-align:center;overflow:hidden;text-overflow:ellipsis}
.st-big .names b{display:block;font-family:var(--font-display);font-size:13px;color:var(--ink)}
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

/** Open: the skyline the box's width, on its bands, each column named. */
export function ScoreOpen({ parts }: { parts: ScorePart[] }) {
  return (
    <span className="st-big">
      <span className="st-sky" role="img" aria-label="i criteri sulle fasce 40 e 70">
        <span
          className="zone"
          style={
            {
              bottom: MET + "%",
              top: 0,
              background: "color-mix(in srgb, var(--heat-good) 8%, transparent)",
            } as CSSProperties
          }
        />
        <span
          className="zone"
          style={{
            bottom: PART + "%",
            height: MET - PART + "%",
            background: "color-mix(in srgb, var(--heat-fair) 8%, transparent)",
          }}
        />
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
        <span className="ln" style={{ bottom: PART + "%" }} />
      </span>
      <span className="names" aria-hidden="true">
        {parts.map((q) => (
          <span key={q.name} style={{ flexGrow: q.weight, flexBasis: 0 }}>
            <b>{Math.round(q.score * 100)}</b>
            {q.name}
          </span>
        ))}
      </span>
      <span className="k-help">
        colonna larga quanto il peso, piena quanto il voto · fasce 40 e 70
      </span>
    </span>
  );
}
