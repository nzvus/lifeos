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
import { FitLine } from "./FitLine";
import { Verdict } from "./Verdict";
import type { HeatLevel } from "./nutrient-rows";
import { F, MET, PART } from "./format";
import { WORDS } from "./words";

export type CriteriaData = {
  value: number | null;
  parts: {
    name: string;
    /** Its key in the model (a criterion's, «density»), for the filter between strumenti. */
    key?: string;
    /** A short name for its tile (§189: «densità»). */
    short?: string;
    score: number;
    weight: number;
    /** Each part's share of this criterion's input, by the part's key (MOD-61, VIS-107). */
    split?: Record<string, number>;
  }[];
  /** Criteria that do not count here, each with why: «valore (manca il prezzo)». */
  missing: string[];
  /** Its «Come valutiamo» page, the model's criteria and their sources. */
  how?: string;
  /** What would raise it, in the day's words, when the app knows (UI-75). */
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
  howInRow = false,
}: {
  data: CriteriaData;
  planned?: boolean;
  /** Its box draws «Come valutiamo» as «?» in the actions row (PlanBox, §167): no link here. */
  howInRow?: boolean;
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
      {data.how && !howInRow && (
        <a className="k-link" href={data.how}>
          {WORDS.scoreHow}
        </a>
      )}
    </div>
  );
}

/** How the criteria read beside the misure (his §181, §189): lit by a misura, one picked. */
export type CriteriaFilter = {
  /** The criteria a picked misura feeds; null: none picked, all lit. */
  lit: string[] | null;
  /** The criterion picked (F3): its misure light up. */
  picked: string | null;
  onPick: (key: string) => void;
};

const TONES = [1, 0.75, 0.55, 0.38, 0.22];
/** The voto's band as the misure's arrows (§146): ≥ 70 two up, ≥ 40 one up, under it one down. */
const level = (v: number): HeatLevel => (v >= MET ? "good" : v >= PART ? "fair" : "bad");

/**
 * The voto as tiles (his pick V-A, §183, §189), the misure's grammar: first its total — the number
 * in its band's colour and the 100-point bar of its criteria — then each criterion a tile, three
 * a row: its colour, its short name, the points it lost («−29», «✓»), its arrows; under them its
 * points as a track — as long as its weight (the heaviest the whole tile), filled as far as it
 * scored, the fill split by ingredient (MOD-61 `split`, the criterion's colour in shades). What
 * does not count is a dim tile with its name and «–», its reason on hover and for a screen reader.
 */
export function CriteriaTiles({
  data,
  planned = false,
  filter,
}: {
  data: CriteriaData;
  planned?: boolean;
  filter?: CriteriaFilter;
}) {
  const top = Math.max(...data.parts.map((q) => q.weight), 0.0001);
  const parts = data.parts.map((q, i) => ({
    ...q,
    k: q.key ?? q.name,
    i: (i % CRIT) + 1,
    v: pct(q.score),
    max: q.weight * 100,
    got: q.weight * q.score * 100,
  }));
  const state = (k: string) =>
    filter?.picked === k
      ? " picked"
      : filter?.lit && !filter.lit.includes(k)
        ? " dim"
        : "";
  return (
    <div className={"k-critview k-ctiles-all" + (planned ? " planned" : "")}>
      <div className="k-ctotal">
        {data.value !== null && (
          <b className="k-num" style={{ color: band(data.value) }}>
            {data.value}
          </b>
        )}
        <div
          className="k-cpts"
          role="img"
          aria-label={`${data.value ?? "—"} punti su 100${planned ? ", previsto" : ""}`}
        >
          {parts.map((q) => (
            <span
              key={q.k}
              className={"seg" + state(q.k)}
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
            </span>
          ))}
        </div>
      </div>
      <div className="k-ctiles">
        {parts.map((q) => {
          const lost = q.max - q.got;
          const pieces = q.split
            ? Object.entries(q.split)
                .filter(([, x]) => x > 0)
                .sort((a, b) => b[1] - a[1])
            : [];
          const sum = pieces.reduce((a, [, x]) => a + x, 0) || 1;
          return (
            <button
              key={q.k}
              type="button"
              className={"k-ctile" + (lost < 0.5 ? " full" : "") + state(q.k)}
              style={id(q.i)}
              aria-pressed={filter?.picked === q.k}
              aria-label={`${q.name}: ${F.n(q.got, 0)} su ${F.n(q.max, 0)}`}
              {...(filter ? { onClick: () => filter.onPick(q.k) } : {})}
            >
              <FitLine className="k-line g1">
                <span className="k-cid" aria-hidden="true" />
                <span className="nm">{q.short ?? q.name}</span>
                <b className="k-num b3">{lost >= 0.5 ? "−" + F.n(lost, 0) : "✓"}</b>
                <Verdict level={level(q.v)} />
              </FitLine>
              <span
                className="k-track"
                aria-hidden="true"
                style={{ width: ((q.weight / top) * 100).toFixed(1) + "%" }}
              >
                {pieces.length > 1 ? (
                  pieces.map(([key, x], n) => (
                    <span
                      key={key}
                      className="k-seg"
                      style={{
                        width: ((x / sum) * q.v).toFixed(1) + "%",
                        opacity: TONES[Math.min(TONES.length - 1, n)],
                      }}
                    />
                  ))
                ) : (
                  <span className="k-seg" style={{ width: q.v + "%" }} />
                )}
              </span>
            </button>
          );
        })}
        {data.missing.map((m) => {
          const [name, reason] = why(m);
          return (
            <span
              key={m}
              className="k-ctile none"
              title={reason}
              aria-label={name + (reason ? ": " + reason : "")}
            >
              <FitLine className="k-line g1">
                <span className="nm">{name}</span>
                <b className="k-num b3">–</b>
              </FitLine>
              <span className="k-track" aria-hidden="true" />
            </span>
          );
        })}
      </div>
      {data.action && <p className="k-help">{data.action}</p>}
    </div>
  );
}
