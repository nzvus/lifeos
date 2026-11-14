/**
 * The parts of the day on Oggi's timeline (ledger UI-77, decided 30 Oct): a
 * full-width band of that part's sky that cuts the rail — the sun at its
 * height on the day's arc, the moon at night, rising once on load — and the
 * band that closes the day. `EmptyTime` is two hours or more with nothing:
 * a thin dashed bar in the rail's place and a link that fills it.
 */
import type { CSSProperties } from "react";
import { Glyph } from "./Glyph";
import type { GlyphOf } from "./glyph";

export type DayPartName = "Mattina" | "Mezzogiorno" | "Pomeriggio" | "Sera" | "Notte";

/** Each part's sky (two colour tokens) and the sun's place on the arc (null: the moon). */
const SKY: Record<DayPartName | "Fine giornata", [string, string, number | null]> = {
  Mattina: ["--macro-carbs", "--moment-breakfast", 0.2],
  Mezzogiorno: ["--macro-fat", "--macro-carbs", 0.5],
  Pomeriggio: ["--macro-carbs", "--warn", 0.75],
  Sera: ["--warn", "--moment-dinner", 0.96],
  Notte: ["--moment-dinner", "--moment-dinner", null],
  "Fine giornata": ["--moment-dinner", "--hairline", null],
};

export function DayPart({
  name,
  label,
  when,
  empty = false,
  open,
  onToggle,
  summary,
  icons = [],
}: {
  name: DayPartName | "Fine giornata";
  /** Parts merged into one band: «Mattina – Pomeriggio»; the sky is the first's. */
  label?: string;
  /** «dalle 12:00», «alle 04:00». */
  when: string;
  /** A part already passed with nothing in it says so. */
  empty?: boolean;
  /**
   * A part that closes («Oggi a livelli» step 4): the band is a button; closed it says
   * `summary` («3 voci · 1.016 kcal») and the voci's `icons` in place of its hour.
   */
  open?: boolean;
  onToggle?: () => void;
  summary?: string;
  icons?: GlyphOf[];
}) {
  const [a, b, f] = SKY[name];
  // Rounded: the server and the browser must write the same numbers (hydration).
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const at = (x: number) => ({
    x: r2(10 + 100 * x),
    y: r2(40 - 30 * Math.sin(Math.PI * x)),
  });
  const s = f === null ? null : at(f);
  const end = name === "Fine giornata";
  const shut = onToggle !== undefined && !open;
  const Tag = onToggle ? "button" : "div";
  return (
    <Tag
      className={
        "k-part" +
        (empty ? " empty" : "") +
        (end ? " end" : "") +
        (onToggle ? " toggle" : "")
      }
      {...(onToggle
        ? {
            type: "button" as const,
            onClick: onToggle,
            "aria-expanded": !shut,
            "aria-label":
              (label ?? name) +
              (shut && summary ? ", " + summary : when ? ", " + when : "") +
              (shut ? ": tocca per aprire" : ": tocca per chiudere"),
          }
        : {
            role: "separator",
            "aria-label":
              (label ?? name) + (when ? ", " + when : "") + (empty ? ", niente" : ""),
          })}
      style={
        {
          "--sky-a": `var(${a})`,
          "--sky-b": `var(${b})`,
        } as CSSProperties
      }
    >
      <span className="nm">{label ?? name}</span>
      <span className="t">
        {shut && summary
          ? said(summary)
          : empty
            ? when
              ? "niente · " + when
              : "niente"
            : when}
      </span>
      {shut && icons.length > 0 && (
        <span className="ics" aria-hidden="true">
          {icons.slice(0, 4).map((g, i) => (
            <Glyph key={i} of={g} size="xs" />
          ))}
        </span>
      )}
      <svg viewBox="0 0 120 44" aria-hidden="true">
        <path className="arc" d="M10 40 A50 30 0 0 1 110 40" />
        <line className="hz" x1="0" x2="120" y1="40" y2="40" />
        {s ? (
          <g className="body">
            <circle className="sun" cx={s.x} cy={s.y} r="6" />
            {[0, 60, 120, 180, 240, 300].map((d) => (
              <line
                key={d}
                className="ray"
                x1={r2(s.x + 8 * Math.cos((d * Math.PI) / 180))}
                y1={r2(s.y + 8 * Math.sin((d * Math.PI) / 180))}
                x2={r2(s.x + 10.5 * Math.cos((d * Math.PI) / 180))}
                y2={r2(s.y + 10.5 * Math.sin((d * Math.PI) / 180))}
              />
            ))}
          </g>
        ) : (
          <g className="body">
            <path
              className="moon"
              d={
                end
                  ? "M100 26a7 7 0 1 0 6 10a5.5 5.5 0 0 1 -6 -10z"
                  : "M60 8a8 8 0 1 0 7 12a6.5 6.5 0 0 1 -7 -12z"
              }
            />
            {!end &&
              [
                [30, 14],
                [86, 10],
                [96, 24],
              ].map(([x, y]) => (
                <circle key={x} className="star" cx={x} cy={y} r="1.2" />
              ))}
          </g>
        )}
      </svg>
    </Tag>
  );
}

/** «2 voci · 1.677 kcal»: on a narrow phone the count gives way to the kcal (kit.css). */
function said(summary: string) {
  const at = summary.indexOf(" · ");
  if (at < 0) return summary;
  return (
    <>
      <span className="cnt">{summary.slice(0, at + 3)}</span>
      {summary.slice(at + 3)}
    </>
  );
}

export function EmptyTime({
  minutes,
  label,
  href,
  what,
}: {
  /** How long nothing happened, for the bar's height. */
  minutes: number;
  /** «2 h 08 senza niente». */
  label: string;
  href: string;
  /** «+ Pranzo», «+ aggiungi». */
  what: string;
}) {
  return (
    <div className="k-gap">
      <span className="bar" style={{ height: Math.min(72, Math.max(28, minutes / 4)) }} />
      <a href={href}>
        {label} <b>{what}</b>
      </a>
    </div>
  );
}
