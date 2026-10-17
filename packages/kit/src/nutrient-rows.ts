/**
 * nutrient-rows.ts — what the Nutrients component draws (kit.md §4), ported
 * from the boards' Nutrients: data in, rows out, every number through `F`.
 * Pure, so it is tested without a browser; `Nutrients.tsx` only renders.
 *
 * L1 is the day (or a meal opened): kcal against its target, one row per
 * macro (eaten, then planned hatched, the target as a tick), the maxima
 * below. A macro with its kinds (`parts`) shades its bar by kind in the
 * fixed order of kinds.md, what no estimate splits last ("senza stima");
 * without them it is one colour. Without a target
 * there is no tick and no "/ target", and the bars share one scale (a meal
 * on its own: its protein against its carbs).
 */
import { F, type State } from "./format";

export type MacroKey = "protein" | "carbs" | "fat" | "fiber";
export type LimitKey = "sugars" | "sat" | "salt";

export type NutrientsData = {
  kcal?: { v: number; planned?: number; t?: number | null };
  macros: {
    key: MacroKey;
    v: number;
    planned?: number;
    t?: number | null;
    /** Kind → grams (kinds.md), when the foods carry them. */
    parts?: Record<string, number>;
    /** [name, grams], largest first. */
    sources?: [string, number][];
    extras?: { t: string; state?: State }[];
  }[];
  limits?: { key: LimitKey; v: number; t: number }[];
  /** Vitamins and minerals, grouped; the page judges each (a state), the kit draws it. */
  micros?: {
    summary: string;
    groups: {
      name: string;
      items: { name: string; v: number; t: number | null; unit: string; state?: State }[];
    }[];
  };
};

export const MACRO_COLOR: Record<MacroKey, string> = {
  protein: "var(--macro-protein)",
  carbs: "var(--macro-carbs)",
  fat: "var(--macro-fat)",
  fiber: "var(--macro-fiber)",
};
const NAME: Record<MacroKey, string> = {
  protein: "Proteine",
  carbs: "Carboidrati",
  fat: "Grassi",
  fiber: "Fibre",
};
const LIMIT: Record<LimitKey, string> = {
  sugars: "Zuccheri",
  sat: "Grassi saturi",
  salt: "Sale",
};
/** Each macro's kinds: fixed order, fixed shade, so a kind looks the same everywhere. */
const KINDS: Record<MacroKey, [string, string, number][]> = {
  protein: [
    ["high", "qualità alta", 1],
    ["medium", "qualità media", 0.55],
    ["low", "qualità bassa", 0.3],
    ["none", "senza stima", 0.12],
  ],
  carbs: [
    ["whole", "amidi integrali", 1],
    ["refined", "amidi raffinati e tuberi", 0.66],
    ["intrinsic", "zuccheri di frutta e latte", 0.42],
    ["free", "zuccheri liberi", 0.24],
    ["none", "senza stima", 0.12],
  ],
  fat: [
    ["mufa", "monoinsaturi", 1],
    ["pufa6", "omega-6", 0.68],
    ["n3", "omega-3", 0.46],
    ["sfa", "saturi", 0.3],
    ["trans", "trans", 0.16],
    ["none", "senza stima", 0.1],
  ],
  fiber: [
    ["insoluble", "insolubili", 1],
    ["resistant", "amido resistente", 0.72],
    ["betaglucan", "beta-glucani", 0.52],
    ["pectin", "pectine", 0.38],
    ["inulin", "inulina/FOS", 0.26],
    ["gos", "GOS", 0.19],
    ["none", "senza stima", 0.12],
  ],
};
const SOURCES_SHOWN = 5;

export const shade = (m: MacroKey, tone: number) =>
  "color-mix(in srgb, " +
  MACRO_COLOR[m] +
  " " +
  Math.round(22 + tone * 78) +
  "%, var(--sheet))";
const pct = (v: number, of: number) => ((v / of) * 100).toFixed(1) + "%";
const g = (v: number) => F.n(v, 1);

export type Seg = { w: string; bg: string; planned: boolean };

export function nutrientsL1(d: NutrientsData) {
  const kcal = d.kcal
    ? (() => {
        const k = d.kcal;
        const planned = k.planned ?? 0;
        const t = k.t ?? null;
        return {
          v: F.n(k.v, 0),
          t: t === null ? null : F.num(t, "kcal"),
          left: planned ? F.signed(planned, "kcal") + " previste" : "",
          /** No target, no bar: a bar needs something to be measured against. */
          bar:
            t === null
              ? null
              : {
                  w: pct(Math.min(k.v, t), t),
                  pw: pct(Math.min(planned, Math.max(0, t - k.v)), t),
                },
          aria:
            "Energia: " +
            F.num(k.v, "kcal") +
            (planned ? ", " + F.num(planned, "kcal") + " previste" : "") +
            (t === null ? "" : ", obiettivo " + F.num(t, "kcal")),
        };
      })()
    : null;

  // Macros without a target share one scale, so their bars compare with each other.
  const shared =
    Math.max(
      0,
      ...d.macros.filter((m) => m.t == null).map((m) => m.v + (m.planned ?? 0)),
    ) * 1.05;
  const macros = d.macros.map((m) => {
    const planned = m.planned ?? 0;
    const t = m.t ?? null;
    const scale = (t === null ? shared : Math.max(t * 1.25, (m.v + planned) * 1.05)) || 1;
    const kinds = KINDS[m.key].filter(([k]) => (m.parts?.[k] ?? 0) > 0);
    const segs: Seg[] = kinds.length
      ? kinds.map(([k, , tone]) => ({
          w: pct(m.parts![k]!, scale),
          bg: shade(m.key, tone),
          planned: false,
        }))
      : m.v > 0
        ? [{ w: pct(m.v, scale), bg: shade(m.key, 1), planned: false }]
        : [];
    if (planned > 0)
      segs.push({ w: pct(planned, scale), bg: shade(m.key, 0.5), planned: true });
    const sources = m.sources ?? [];
    const top = sources.reduce((a, s) => Math.max(a, s[1]), 0) || 1;
    const rest = sources.slice(SOURCES_SHOWN);
    return {
      key: m.key,
      name: NAME[m.key],
      color: MACRO_COLOR[m.key],
      value: g(m.v),
      target: t === null ? null : F.num(t, "g"),
      mark: t === null ? null : pct(t, scale),
      segs,
      kinds: kinds.map(([k, name, tone]) => ({
        name,
        v: g(m.parts![k]!),
        c: shade(m.key, tone),
        w: pct(m.parts![k]!, scale),
      })),
      sources: [
        ...sources.slice(0, SOURCES_SHOWN).map(([name, v]) => ({
          name,
          g: g(v),
          w: ((v / top) * 100).toFixed(0) + "%",
          faint: false,
        })),
        ...(rest.length
          ? [
              {
                name: "e altri " + rest.length,
                g: g(rest.reduce((a, s) => a + s[1], 0)),
                w: "0%",
                faint: true,
              },
            ]
          : []),
      ],
      extras: (m.extras ?? []).map((x) => ({ t: x.t, c: F.tone(x.state) })),
      aria:
        NAME[m.key] +
        " " +
        F.num(m.v, "g") +
        (t === null ? "" : " su " + F.num(t, "g")) +
        (planned ? ", " + F.num(planned, "g") + " previsti" : "") +
        (kinds.length
          ? ": " + kinds.map(([k, name]) => name + " " + g(m.parts![k]!)).join(", ")
          : ""),
    };
  });

  const limits = (d.limits ?? []).map((l) => ({
    key: l.key,
    v: g(l.v),
    t: F.num(l.t, "g"),
    w: Math.min(100, (l.v / l.t) * 100).toFixed(0) + "%",
    color: F.tone(F.cap(l.v, l.t)),
    aria: LIMIT[l.key] + " " + F.num(l.v, "g") + " su un massimo di " + F.num(l.t, "g"),
  }));

  const micros = d.micros
    ? {
        summary: d.micros.summary,
        groups: d.micros.groups.map((g) => ({
          name: g.name,
          items: g.items.map((i) => ({
            name: i.name,
            v:
              i.t === null
                ? F.num(i.v, i.unit)
                : F.n(i.v, i.v < 10 ? 1 : 0) + " / " + F.num(i.t, i.unit),
            w: i.t === null ? "0%" : Math.min(100, (i.v / i.t) * 100).toFixed(0) + "%",
            color: F.tone(i.state),
            aria:
              i.name +
              " " +
              F.num(i.v, i.unit) +
              (i.t === null ? "" : " su " + F.num(i.t, i.unit)),
          })),
        })),
      }
    : null;

  return { kcal, macros, limits, micros };
}
