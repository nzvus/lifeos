/**
 * Forms (bars study §6, his 19 Nov «potresti valutare altri tipi completamente diversi di
 * visualizzazione, non necessariamente barre»): three ways to show a set of judged amounts —
 * his micros of 9 Nov — without words on a bar. Gallery proposals; his pick becomes a form of
 * `Meter`. Each keeps: identity colour, the target, the zones (FD-30), the tip by zone, a mark
 * besides colour (VIS-20/21), the amount in the label for screen readers.
 */
import type { CSSProperties } from "react";
import { F } from "./format";
import { heatLevel, type HeatZone } from "./nutrient-rows";

export type FormItem = {
  name: string;
  v: number;
  t: number;
  unit: string;
  zones: HeatZone[];
  color: string;
};
export type FormLook = "thin" | "tiles" | "rings";

const LEVEL_COLOR: Record<string, string> = {
  good: "var(--heat-good)",
  fair: "var(--heat-fair)",
  bad: "var(--heat-bad)",
  danger: "var(--heat-danger)",
};
const MARK: Record<string, string> = {
  good: "met",
  fair: "part",
  bad: "no",
  danger: "no",
};

/** One item's numbers: its scale (room past the target), its share, its zone. */
function measure(i: FormItem) {
  const scale = Math.max(i.v * 1.05, i.t * 1.5);
  const level = heatLevel(i.v, i.zones) ?? "fair";
  const bands = i.zones.map((z, n) => {
    const from = Math.min(z.from, scale);
    const to = Math.min(scale, i.zones[n + 1]?.from ?? scale);
    return {
      left: (from / scale) * 100,
      w: ((to - from) / scale) * 100,
      c: LEVEL_COLOR[z.level]!,
    };
  });
  return {
    fill: Math.min(100, (i.v / scale) * 100),
    target: (i.t / scale) * 100,
    share: Math.round((i.v / i.t) * 100),
    level,
    tone: LEVEL_COLOR[level]!,
    bands,
    aria: `${i.name}: ${F.num(i.v, i.unit)} su ${F.num(i.t, i.unit)}`,
  };
}

/** The zones as the bar's own background (a bullet chart). */
function Bands({ bands }: { bands: ReturnType<typeof measure>["bands"] }) {
  return (
    <>
      {bands.map((b, n) => (
        <span
          key={n}
          className="band"
          style={{ left: b.left + "%", width: b.w + "%", background: b.c }}
        />
      ))}
    </>
  );
}

function Mark({ level }: { level: string }) {
  return <span className={"k-st " + (MARK[level] ?? "part")} aria-hidden="true" />;
}

/** V1: one thin line of words, a hair bar under it whose background is its zones. */
function Thin({ items }: { items: FormItem[] }) {
  return (
    <div className="k-fthin">
      {items.map((i) => {
        const m = measure(i);
        return (
          <div key={i.name} className="row" role="img" aria-label={m.aria}>
            <span className="top">
              <Mark level={m.level} />
              <span className="nm">{i.name}</span>
              <b className="n">{m.share} %</b>
            </span>
            <span className="bar">
              <Bands bands={m.bands} />
              <i style={{ width: m.fill + "%", background: i.color }} />
              <span className="tick" style={{ left: m.target + "%" }} />
              <span className="tip" style={{ left: m.fill + "%", background: m.tone }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** V2: a tile each, three to a row: name, share, mark; a hair bar along its bottom edge. */
function Tiles({ items }: { items: FormItem[] }) {
  return (
    <div className="k-ftiles">
      {items.map((i) => {
        const m = measure(i);
        return (
          <div
            key={i.name}
            className="tile"
            role="img"
            aria-label={m.aria}
            style={{ "--id": i.color, "--tone": m.tone } as CSSProperties}
          >
            <span className="nm">{i.name}</span>
            <span className="row">
              <b className="n">{m.share} %</b>
              <Mark level={m.level} />
            </span>
            <span className="bar">
              <Bands bands={m.bands} />
              <i style={{ width: m.fill + "%" }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** V3: a ring each, four to a row: its zones faint on the track, the value in its colour. */
function Rings({ items }: { items: FormItem[] }) {
  const R = 15;
  const C = 2 * Math.PI * R;
  return (
    <div className="k-frings">
      {items.map((i) => {
        const m = measure(i);
        return (
          <div key={i.name} className="ring" role="img" aria-label={m.aria}>
            <svg viewBox="0 0 40 40" aria-hidden="true">
              {/* from the top, clockwise */}
              <g transform="rotate(-90 20 20)">
                {m.bands.map((b, n) => (
                  <circle
                    key={n}
                    cx="20"
                    cy="20"
                    r={R}
                    className="band"
                    stroke={b.c}
                    strokeDasharray={`${(b.w / 100) * C} ${C}`}
                    strokeDashoffset={-(b.left / 100) * C}
                  />
                ))}
                <circle
                  cx="20"
                  cy="20"
                  r={R}
                  className="val"
                  stroke={i.color}
                  strokeDasharray={`${(m.fill / 100) * C} ${C}`}
                />
              </g>
              <circle
                className="tickdot"
                cx={20 + R * Math.sin((m.target / 100) * 2 * Math.PI)}
                cy={20 - R * Math.cos((m.target / 100) * 2 * Math.PI)}
                r="1.6"
              />
            </svg>
            <b className="n" style={{ color: m.tone }}>
              {m.share}
            </b>
            <span className="nm">
              <Mark level={m.level} /> {i.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Forms({ items, look }: { items: FormItem[]; look: FormLook }) {
  return look === "thin" ? (
    <Thin items={items} />
  ) : look === "tiles" ? (
    <Tiles items={items} />
  ) : (
    <Rings items={items} />
  );
}
