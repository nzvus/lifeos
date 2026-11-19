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
import { Fragment, type CSSProperties } from "react";
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
      {lost.length > 0 && (
        <ul className="k-clegend">
          {lost.map((q) => (
            <li key={q.name}>
              <span className="k-cid" style={id(q.i)} aria-hidden="true" />
              <Mark v={q.v} />
              <span className="nm">{q.name}</span>
              <span className="k-help">
                {F.n(q.got, 0)} su {F.n(q.max, 0)}
              </span>
              <b className="k-num">−{F.n(q.max - q.got, 0)}</b>
            </li>
          ))}
        </ul>
      )}
      {full.length > 0 && (
        <p className="k-cfull">
          <span className="k-help">{WORDS.scoreFull}:</span>{" "}
          {/* a name stays whole; the line breaks between names */}
          {full.map((q, n) => (
            <Fragment key={q.name}>
              <span
                className="k-nowrap"
                aria-label={`${q.name}: pieno, ${WORDS.weighs(pct(q.weight))}`}
              >
                <span className="k-cid" style={id(q.i)} aria-hidden="true" /> {q.name}
                {n < full.length - 1 ? " ·" : ""}
              </span>{" "}
            </Fragment>
          ))}
        </p>
      )}
      {data.action && <p className="k-help">{data.action}</p>}
      {(data.missing.length > 0 || data.how) && (
        <div className="k-critfoot">
          {data.missing.length > 0 && (
            <span className="k-help">
              {WORDS.scoreMissing}: {data.missing.join(" · ")}
            </span>
          )}
          {data.how && (
            <a className="k-link" href={data.how}>
              {WORDS.scoreHow}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
