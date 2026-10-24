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

/**
 * A number's zones (E5 ranges, dossiers/ranges.md): each from its edge to the
 * next one's, the last open. They are drawn as a thin band along the bottom
 * of the number's own bar (`heatStrip`); the zone the value (plus the plan)
 * is in gives the word.
 */
export type HeatLevel = "danger" | "bad" | "fair" | "good";
export type HeatZone = { from: number; level: HeatLevel };

export type NutrientsData = {
  /**
   * Level L2 (a meal's window): the foods it is made of, each with its grams
   * per macro and kind. Each bar is then drawn per food (shaded by kind
   * inside), a food's chip highlights its part everywhere, and each kind
   * says which foods it came from. `sources` are derived from them.
   */
  foods?: {
    key: string;
    name: string;
    /** Its quantity, as shown («200 g»). */
    amount: string;
    kcal: number;
    /** Macro → kind → grams; a key outside the macro's kinds («all») is drawn in its own colour. */
    macros: Partial<Record<MacroKey, Record<string, number>>>;
  }[];
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
    zones?: HeatZone[];
    /** Kind → its zones, for the kinds a guideline speaks of (free sugars, trans, omega-3…). */
    partZones?: Record<string, HeatZone[]>;
  }[];
  /** `name` replaces the key's (free sugars when the kinds tell them apart). */
  limits?: {
    key: LimitKey;
    v: number;
    t: number;
    name?: string;
    zones?: HeatZone[];
    /** The week's mean up to this day, drawn as a tick; `meanDays` days. */
    mean?: number;
    meanDays?: number;
    planned?: number;
  }[];
  /** Vitamins and minerals, grouped; the page judges each (a state), the kit draws it. */
  micros?: {
    summary: string;
    groups: {
      name: string;
      items: {
        name: string;
        v: number;
        t: number | null;
        unit: string;
        state?: State;
        zones?: HeatZone[];
      }[];
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

export const HEAT_WORDS: Record<HeatLevel, string> = {
  danger: "da evitare",
  bad: "pessimo",
  fair: "ok",
  good: "ottimo",
};
const HEAT_STATE: Record<HeatLevel, State> = {
  danger: "danger",
  bad: "bad",
  fair: "warn",
  good: "good",
};
const HEAT_COLOR: Record<HeatLevel, string> = {
  good: "var(--heat-good)",
  fair: "var(--heat-fair)",
  bad: "var(--heat-bad)",
  danger: "var(--heat-danger)",
};

export function heatLevel(v: number, zones: readonly HeatZone[]): HeatLevel | null {
  let level: HeatLevel | null = zones[0]?.level ?? null;
  for (const z of zones) if (v >= z.from) level = z.level;
  return level;
}

/**
 * The heat strip under a bar (or, for a limit or a micro, as its bar): the
 * zones in full colour on their own thin line, so they never mix with the
 * bar's kinds; a solid mark where the number is, a hollow one where the
 * plan takes it, a small triangle at the week's mean.
 */
export type HeatStrip = {
  zones: { w: string; c: string; danger: boolean }[];
  at: string;
  to: string | null;
  mean: string | null;
};

const at = (v: number, scale: number) =>
  Math.max(0, Math.min(100, (v / scale) * 100)).toFixed(1) + "%";

export function heatStrip(
  zones: readonly HeatZone[],
  scale: number,
  v: number,
  planned = 0,
  mean?: number,
): HeatStrip {
  return {
    zones: zones.map((z, i) => {
      const end = Math.min(scale, zones[i + 1]?.from ?? scale);
      return {
        w: Math.max(0, ((end - Math.min(z.from, scale)) / scale) * 100).toFixed(1) + "%",
        c: HEAT_COLOR[z.level],
        danger: z.level === "danger",
      };
    }),
    at: at(v, scale),
    to: planned > 0 ? at(v + planned, scale) : null,
    mean: mean === undefined ? null : at(mean, scale),
  };
}

/** Where the good zone ends, when it does: the bar shows all of it. */
const goodEnd = (zones: readonly HeatZone[]) => {
  const i = zones.findIndex((z) => z.level === "good");
  return i >= 0 ? (zones[i + 1]?.from ?? null) : null;
};

/**
 * What a judged number adds to its row: the strip, the word, its state. With
 * something planned the word judges where the plan takes the day («→ ottimo»).
 */
function heat(
  v: number,
  zones: readonly HeatZone[] | undefined,
  scale: number,
  planned = 0,
  mean?: number,
) {
  const level = zones?.length ? heatLevel(v + planned, zones) : null;
  return level
    ? {
        strip: heatStrip(zones!, scale, v, planned, mean),
        word: (planned > 0 ? "→ " : "") + HEAT_WORDS[level],
        state: HEAT_STATE[level],
      }
    : { strip: null, word: null, state: null };
}

export const shade = (m: MacroKey, tone: number) =>
  "color-mix(in srgb, " +
  MACRO_COLOR[m] +
  " " +
  Math.round(22 + tone * 78) +
  "%, var(--sheet))";
const pct = (v: number, of: number) => ((v / of) * 100).toFixed(1) + "%";
const g = (v: number) => F.n(v, 1);

/** `dim`: another food is highlighted (L2). */
export type Seg = { w: string; bg: string; planned: boolean; dim: boolean };

const total = (o: Record<string, number> | undefined) =>
  Object.values(o ?? {}).reduce((a, v) => a + v, 0);
/** A food chip's swatch: the most energy first, darker (the boards' tones). */
const TONES = [1, 0.75, 0.55, 0.38, 0.22];

/**
 * Level L0 (kit.md §4; the boards' `k-l0`): one thin bar per macro in a
 * meal's box, its kinds in their shades, each as a share of the target (the
 * slot's when the plan gives one, else the day's: the page decides); with
 * no target the macros share one scale. No sources, no notes: the box opens
 * for those.
 */
export function nutrientsL0(d: NutrientsData) {
  const shared = Math.max(0, ...d.macros.filter((m) => m.t == null).map((m) => m.v)) || 1;
  return d.macros.map((m) => {
    const scale = m.t ?? shared;
    const kinds = KINDS[m.key].filter(([k]) => (m.parts?.[k] ?? 0) > 0);
    const w = (v: number) => Math.min(100, (v / scale) * 100).toFixed(1) + "%";
    const segs = kinds.length
      ? kinds.map(([k, , tone]) => ({ w: w(m.parts![k]!), bg: shade(m.key, tone) }))
      : m.v > 0
        ? [{ w: w(m.v), bg: shade(m.key, 1) }]
        : [];
    return {
      key: m.key,
      value: g(m.v),
      segs,
      aria:
        NAME[m.key] +
        " " +
        F.num(m.v, "g") +
        (m.t == null ? "" : " su " + F.num(m.t, "g") + " dell’obiettivo"),
    };
  });
}

/** `sel`: the food highlighted in a meal's window (L2), by key; null for none. */
export function nutrientsL1(d: NutrientsData, sel: string | null = null) {
  const foodsIn = d.foods?.length ? d.foods : null;
  const byKcal = [...(foodsIn ?? [])].sort((a, b) => b.kcal - a.kcal);
  const foods = (foodsIn ?? []).map((f) => ({
    key: f.key,
    name: f.name,
    amount: f.amount,
    tone: TONES[Math.min(TONES.length - 1, byKcal.indexOf(f))]!,
    pressed: sel === f.key,
  }));
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
    const end = m.zones ? goodEnd(m.zones) : null;
    const scale =
      (t === null
        ? Math.max(shared, (end ?? 0) * 1.1)
        : Math.max(t * 1.25, (m.v + planned) * 1.05, (end ?? 0) * 1.1)) || 1;
    const h = heat(m.v, m.zones, scale, planned);
    const kinds = KINDS[m.key].filter(([k]) => (m.parts?.[k] ?? 0) > 0);
    const has = (foodsIn ?? []).filter((f) => total(f.macros[m.key]) > 0);
    const segs: Seg[] = has.length
      ? has.map((f) =>
          foodSeg(m.key, f.macros[m.key]!, scale, sel !== null && sel !== f.key),
        )
      : kinds.length
        ? kinds.map(([k, , tone]) => ({
            w: pct(m.parts![k]!, scale),
            bg: shade(m.key, tone),
            planned: false,
            dim: false,
          }))
        : m.v > 0
          ? [{ w: pct(m.v, scale), bg: shade(m.key, 1), planned: false, dim: false }]
          : [];
    if (planned > 0)
      segs.push({
        w: pct(planned, scale),
        bg: shade(m.key, 0.5),
        planned: true,
        dim: false,
      });
    const sources: [string, number, string?][] = has.length
      ? has
          .map((f): [string, number, string] => [f.name, total(f.macros[m.key]), f.key])
          .sort((a, b) => b[1] - a[1])
      : (m.sources ?? []);
    // Which foods a kind came from, in a window of more than one food.
    const from = (k: string) => {
      const by = has
        .map((f): [string, number] => [f.name, f.macros[m.key]?.[k] ?? 0])
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);
      return has.length > 1 && by.length > 0
        ? by
            .slice(0, 3)
            .map(([n, v]) => n + " " + g(v))
            .join(" · ") + (by.length > 3 ? " · altri " + (by.length - 3) : "")
        : null;
    };
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
      kinds: kinds.map(([k, name, tone]) => {
        const v = m.parts![k]!;
        const zones = m.partZones?.[k];
        if (!zones?.length)
          return {
            from: from(k),
            name,
            v: g(v),
            c: shade(m.key, tone),
            fill: shade(m.key, tone),
            w: pct(v, scale),
            strip: null,
            word: null,
            state: null,
          };
        // A judged kind on its own scale, so its zones show (omega-3's 1.5 g on a 100 g fat bar would not).
        const i = zones.findIndex((z) => z.level === "good");
        const edge = zones[i + 1]?.from ?? zones[i]?.from ?? v;
        const own = Math.max(v * 1.05, edge * 1.5) || 1;
        const h = heat(v, zones, own);
        // The swatch keeps the kind's shade (it names its part of the macro's bar); the fill its zone.
        return {
          from: from(k),
          name,
          v: g(v),
          c: shade(m.key, tone),
          fill: F.tone(h.state ?? undefined),
          w: pct(v, own),
          ...h,
        };
      }),
      // One food alone has nothing to compare: its window shows no «da dove».
      sources:
        has.length === 1
          ? []
          : [
              ...sources.slice(0, SOURCES_SHOWN).map(([name, v, key]) => ({
                name,
                g: g(v),
                w: ((v / top) * 100).toFixed(0) + "%",
                faint: false,
                dim: sel !== null && key !== undefined && key !== sel,
              })),
              ...(rest.length
                ? [
                    {
                      name: "e altri " + rest.length,
                      g: g(rest.reduce((a, s) => a + s[1], 0)),
                      w: "0%",
                      faint: true,
                      dim: false,
                    },
                  ]
                : []),
            ],
      extras: (m.extras ?? []).map((x) => ({ t: x.t, c: F.tone(x.state) })),
      ...h,
      aria:
        NAME[m.key] +
        " " +
        F.num(m.v, "g") +
        (t === null ? "" : " su " + F.num(t, "g")) +
        (h.word ? ", " + h.word + (planned ? " con il previsto" : "") : "") +
        (planned ? ", " + F.num(planned, "g") + " previsti" : "") +
        (kinds.length
          ? ": " + kinds.map(([k, name]) => name + " " + g(m.parts![k]!)).join(", ")
          : ""),
    };
  });

  // A limit with zones is its strip, running to twice the limit so its zones show past it.
  const limits = (d.limits ?? []).map((l) => {
    const planned = l.planned ?? 0;
    const scale = l.zones?.length ? Math.max((l.v + planned) * 1.05, l.t * 2) : l.t;
    const h = heat(l.v, l.zones, scale, planned, l.mean);
    return {
      key: l.key,
      v: g(l.v),
      t: F.num(l.t, "g"),
      w: Math.min(100, (l.v / scale) * 100).toFixed(0) + "%",
      /** The planned part after it, hatched; null without a plan. */
      pw:
        planned > 0
          ? Math.min(
              100 - Math.min(100, (l.v / scale) * 100),
              (planned / scale) * 100,
            ).toFixed(0) + "%"
          : null,
      color: F.tone(h.state ?? F.cap(l.v, l.t)),
      strip: h.strip,
      word: h.word,
      state: h.state,
      aria:
        (l.name ?? LIMIT[l.key]) +
        " " +
        F.num(l.v, "g") +
        (planned ? ", " + F.num(planned, "g") + " previsti" : "") +
        " su un massimo di " +
        F.num(l.t, "g") +
        (h.word
          ? ", " + h.word.replace("→ ", "") + (planned ? " con il previsto" : "")
          : "") +
        (l.mean === undefined
          ? ""
          : ", media di " +
            F.plural(l.meanDays ?? 0, "giorno", "giorni") +
            " " +
            F.num(l.mean, "g")),
    };
  });

  const micros = d.micros
    ? {
        summary: d.micros.summary,
        groups: d.micros.groups.map((g) => ({
          name: g.name,
          items: g.items.map((i) => {
            const scale =
              i.t === null
                ? null
                : i.zones?.length
                  ? Math.max(i.v * 1.05, i.t * 1.5)
                  : i.t;
            const h = scale === null ? heat(0, undefined, 1) : heat(i.v, i.zones, scale);
            return {
              name: i.name,
              v:
                i.t === null
                  ? F.num(i.v, i.unit)
                  : F.n(i.v, i.v < 10 ? 1 : 0) + " / " + F.num(i.t, i.unit),
              w:
                scale === null
                  ? "0%"
                  : Math.min(100, (i.v / scale) * 100).toFixed(0) + "%",
              color: F.tone(h.state ?? i.state),
              strip: h.strip,
              aria:
                i.name +
                " " +
                F.num(i.v, i.unit) +
                (i.t === null ? "" : " su " + F.num(i.t, i.unit)) +
                (h.word ? ", " + h.word : ""),
            };
          }),
        })),
      }
    : null;

  return { kcal, foods, macros, limits, micros };
}

/** A food's part of a macro's bar, shaded by its kinds left to right (the boards' L2). */
function foodSeg(
  m: MacroKey,
  kinds: Record<string, number>,
  scale: number,
  dim: boolean,
): Seg {
  const fv = total(kinds);
  let at = 0;
  const stops: string[] = [];
  const shades: string[] = [];
  for (const [k, , tone] of KINDS[m]) {
    const v = kinds[k] ?? 0;
    if (v <= 0) continue;
    const c = shade(m, tone);
    shades.push(c);
    stops.push(c + " " + ((at / fv) * 100).toFixed(0) + "%");
    at += v;
    stops.push(c + " " + ((at / fv) * 100).toFixed(0) + "%");
  }
  return {
    w: pct(fv, scale),
    bg:
      shades.length > 1
        ? "linear-gradient(to right, " + stops.join(", ") + ")"
        : (shades[0] ?? shade(m, 1)),
    planned: false,
    dim,
  };
}
