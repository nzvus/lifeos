/**
 * Criteria (VIS-43, PAT-51): a voto opened, one way of drawing its criteria. His 19 Nov: «i voti
 * non mi piacciono per nulla, prendono troppo spazio… la barra dovrebbe avere la priorità e
 * essere in tutta lunghezza… la parte di sinistra si può mettere sulla barra stessa… dammi un
 * po' di proposte». Three looks on the same data, shown side by side in the gallery; his pick
 * becomes the only one. Every look keeps: each criterion's name, score, weight and band (with
 * its mark, never colour alone, VIS-20/21), the edges 40 and 70, what cost the most, what does
 * not count and why, the hint, and «Come valutiamo ›».
 */
import type { CSSProperties } from "react";
import { F } from "./format";
import { WORDS } from "./words";

export type CriteriaLook = "inbar" | "columns" | "points";
export type CriteriaData = {
  value: number | null;
  parts: { name: string; score: number; weight: number }[];
  missing: string[];
  how?: string;
  action?: string;
};

const pct = (x: number) => Math.round(x * 100);

function Foot({ d }: { d: CriteriaData }) {
  return (
    <>
      {d.action && <p className="k-help">{d.action}</p>}
      {(d.missing.length > 0 || d.how) && (
        <div className="k-critfoot">
          {d.missing.length > 0 && (
            <span className="k-help">
              {WORDS.scoreMissing}: {d.missing.join(" · ")}
            </span>
          )}
          {d.how && (
            <a className="k-link" href={d.how}>
              {WORDS.scoreHow}
            </a>
          )}
        </div>
      )}
    </>
  );
}

function Mark({ v }: { v: number }) {
  const j = F.judge(v);
  return <span className={j.cls} role="img" aria-label={j.aria} />;
}

/** A: one full-length bar per criterion, its words written on the bar (his idea). */
function InBar({ d }: { d: CriteriaData }) {
  return (
    <div className="k-crits inbar">
      {d.parts.map((q) => {
        const v = pct(q.score);
        return (
          <div
            key={q.name}
            className="k-cbar"
            role="img"
            aria-label={`${q.name}: ${v} su 100, ${WORDS.weighs(pct(q.weight))}`}
            style={{ "--v": v + "%", "--c": F.judge(v).tone } as CSSProperties}
          >
            <span className="fill" />
            <span className="edge e40" />
            <span className="edge e70" />
            <span className="nm">
              {q.name} <span className="w">{pct(q.weight)} %</span>
            </span>
            <span className="n">
              <Mark v={v} />
              {v}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** A criterion as a stretch as wide as its weight, filled to its score in its band's colour. */
function Stretch({ q, cls }: { q: CriteriaData["parts"][number]; cls: string }) {
  const v = pct(q.score);
  return (
    <span
      className={cls}
      style={
        { flexGrow: q.weight, "--v": v + "%", "--c": F.judge(v).tone } as CSSProperties
      }
    >
      <span className="fill" />
    </span>
  );
}

/** B: the head's skyline grown big — width = weight, height = score — and a legend under it. */
function Columns({ d }: { d: CriteriaData }) {
  return (
    <div className="k-crits columns">
      <div className="k-ccols" aria-hidden="true">
        <span className="edge e40" />
        <span className="edge e70" />
        {d.parts.map((q) => (
          <Stretch key={q.name} q={q} cls="col" />
        ))}
      </div>
      <ul className="k-clegend">
        {d.parts.map((q) => {
          const v = pct(q.score);
          return (
            <li key={q.name}>
              <Mark v={v} />
              <span className="nm">{q.name}</span>
              <b className="k-num">{v}</b>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** C: one bar of 100 points, a stretch per criterion as wide as its weight, filled as far as it
 *  scored: the filled length is the voto. Under it, what each lost, the costliest first. */
function Points({ d }: { d: CriteriaData }) {
  const rows = d.parts
    .map((q) => ({
      ...q,
      v: pct(q.score),
      max: q.weight * 100,
      got: q.weight * q.score * 100,
    }))
    .sort((a, b) => b.max - b.got - (a.max - a.got));
  return (
    <div className="k-crits points">
      <div className="k-cpts" role="img" aria-label={`${d.value ?? "—"} punti su 100`}>
        {d.parts.map((q) => (
          <Stretch key={q.name} q={q} cls="seg" />
        ))}
      </div>
      <ul className="k-clegend lost">
        {rows.map((q) => (
          <li key={q.name}>
            <Mark v={q.v} />
            <span className="nm">{q.name}</span>
            <span className="k-help">
              {F.n(q.got, 0)} su {F.n(q.max, 0)}
            </span>
            <b className="k-num">
              {q.max - q.got >= 0.5 ? "−" + F.n(q.max - q.got, 0) : "✓"}
            </b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Criteria({
  data,
  look = "inbar",
}: {
  data: CriteriaData;
  look?: CriteriaLook;
}) {
  return (
    <div className="k-parts k-critview">
      {look === "inbar" && <InBar d={data} />}
      {look === "columns" && <Columns d={data} />}
      {look === "points" && <Points d={data} />}
      <Foot d={data} />
    </div>
  );
}
