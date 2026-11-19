/**
 * Criteria (VIS-43, PAT-51): a voto opened. His pick of 19 Nov, C «punti», drawn with the
 * macros' grammar (VIS-50/52; his words: «lo stesso criterio per colori e range e forme che
 * usiamo nei macro»): one bar of 100 points, a stretch per criterion as wide as its weight, in
 * the criterion's own colour, filled as far as it scored; what it did not reach hatched; under
 * each stretch its zones (under 40 · 40–70 · over 70) and the tip in its zone's colour; a voto
 * still planned drawn hatched (VIS-22). Under the bar only the criteria that lost points get a
 * row, the costliest first; the full ones share one line, so all of it is in view, condensed
 * (his: «condensare l'informazione ma mostrarla anche interamente»). Then what does not count and
 * why, the hint, «Come valutiamo ›». The band is always also a mark (● ◐ ○), never colour alone.
 */
import type { CSSProperties } from "react";
import { Condensed } from "./Condensed";
import { F, MET, PART } from "./format";
import { WORDS } from "./words";

export type CriteriaData = {
  value: number | null;
  parts: { name: string; score: number; weight: number }[];
  missing: string[];
  how?: string;
  action?: string;
};

/** Six identity colours, in the model's order (the muscles' palette, checked for contrast on
 *  dark); a seventh criterion starts again. */
const CRIT = 6;
const pct = (x: number) => Math.round(x * 100);
const band = (v: number) =>
  v >= MET ? "var(--heat-good)" : v >= PART ? "var(--heat-fair)" : "var(--heat-bad)";
const id = (i: number) => ({ "--id": `var(--crit-${i})` }) as CSSProperties;

/** «valore (manca il prezzo)» → its name and its reason. */
const why = (m: string): [string, string] => {
  const i = m.indexOf(" (");
  return i < 0 ? [m, ""] : [m.slice(0, i), m.slice(i + 2).replace(/\)$/, "")];
};

function Mark({ v }: { v: number }) {
  const j = F.judge(v);
  return <span className={j.cls} role="img" aria-label={j.aria} />;
}

export function Criteria({
  data,
  planned = false,
}: {
  data: CriteriaData;
  planned?: boolean;
}) {
  const parts = data.parts.map((q, i) => ({
    ...q,
    i: (i % CRIT) + 1,
    v: pct(q.score),
    max: q.weight * 100,
    got: q.weight * q.score * 100,
  }));
  const lost = parts
    .filter((q) => q.max - q.got >= 0.5)
    .sort((a, b) => b.max - b.got - (a.max - a.got));
  const full = parts.filter((q) => q.max - q.got < 0.5);
  // One state per model, so every meal's voto opens alike (VIS-70).
  const key = parts.map((q) => q.name).join("|");
  const row = (q: (typeof parts)[number]) => (
    <li key={q.name}>
      <span className="k-cid" style={id(q.i)} aria-hidden="true" />
      <Mark v={q.v} />
      <span className="nm">{q.name}</span>
      <span className="k-help">
        {F.n(q.got, 0)} su {F.n(q.max, 0)}
      </span>
      <b className="k-num">{q.max - q.got >= 0.5 ? "−" + F.n(q.max - q.got, 0) : "✓"}</b>
    </li>
  );
  return (
    <div className={"k-parts k-critview" + (planned ? " planned" : "")}>
      <div
        className="k-cpts"
        role="img"
        aria-label={`${data.value ?? "—"} punti su 100${planned ? ", previsto" : ""}`}
      >
        {parts.map((q) => (
          <span
            key={q.name}
            className="seg"
            style={
              {
                ...id(q.i),
                flexGrow: q.weight,
                "--v": q.v + "%",
                "--band": band(q.v),
              } as CSSProperties
            }
          >
            <span className="bar">
              <span className="fill" />
            </span>
            <span className="zones" aria-hidden="true">
              <span className="z bad" />
              <span className="z fair" />
              <span className="z good" />
            </span>
            <span className="tip" aria-hidden="true" />
          </span>
        ))}
      </div>
      {lost.length > 0 && <ul className="k-clegend">{lost.map(row)}</ul>}
      {/* The full ones on one line, every name in view; open, their rows (PAT-40). */}
      {full.length > 0 && (
        <Condensed
          label={WORDS.scoreFull}
          remember={"voto.full." + key}
          names={full.map((q) => (
            <>
              <span className="k-cid" style={id(q.i)} aria-hidden="true" /> {q.name}
            </>
          ))}
        >
          <ul className="k-clegend">{full.map(row)}</ul>
        </Condensed>
      )}
      {data.action && <p className="k-help">{data.action}</p>}
      {/* What does not count: the names on one line, the reasons on open (his 19 Nov «anche i
          "Non contano" andrebbero condensati»). */}
      {data.missing.length > 0 && (
        <Condensed
          label={WORDS.scoreMissing}
          remember={"voto.missing." + key}
          names={data.missing.map((m) => why(m)[0])}
        >
          <ul className="k-clegend why">
            {data.missing.map((m) => {
              const [name, reason] = why(m);
              return (
                <li key={m}>
                  <span className="nm">{name}</span>
                  {reason && <span className="k-help">{reason}</span>}
                </li>
              );
            })}
          </ul>
        </Condensed>
      )}
      {data.how && (
        <a className="k-link" href={data.how}>
          {WORDS.scoreHow}
        </a>
      )}
    </div>
  );
}
