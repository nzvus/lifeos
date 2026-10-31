/**
 * format.ts — `F`, the one formatter (content.md §1, §3), ported from the
 * boards' fmt.js so the app writes numbers, units, dates and judgements
 * exactly as the boards do. Pages pass raw numbers, ISO dates and states;
 * only F turns them into text and tones. Italian for now (content.md).
 *
 * The boards' `trend` and `pace` are not here: in the app the engines
 * compute them (E4, E5), and F only writes the result.
 */
const NB = " ";
const MINUS = "−";
/** Decimals per unit; grams get one decimal under 100 (0,2 g of salt), none above. */
const DEC: Record<string, number> = {
  kg: 1,
  g: 0,
  mg: 0,
  mcg: 0,
  kcal: 0,
  "%": 0,
  "€": 2,
  l: 1,
  ml: 0,
  km: 1,
  m: 0,
  min: 0,
  h: 1,
  "°C": 0,
  "kg/sett.": 2,
  "": 1,
};
const SMALL: Record<string, number> = { g: 100 };
const MONTHS = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];
const DAYS = [
  "domenica",
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
];
const LETTER = ["D", "L", "M", "M", "G", "V", "S"];

const dec = (v: number, unit: string) =>
  unit in SMALL && Math.abs(v) < SMALL[unit]! ? 1 : (DEC[unit] ?? 1);

function n(v: number, d: number, keep = false): string {
  const r = Math.round(Math.abs(v) * 10 ** d) / 10 ** d;
  const [whole, frac = ""] = r.toFixed(d).split(".");
  const i = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const f = keep ? frac : frac.replace(/0+$/, "");
  return (
    (v < 0 && r !== 0 ? MINUS : "") +
    i +
    (f && (keep || Number(frac) !== 0) ? "," + f : "")
  );
}
const u = (s: string, unit: string) => (unit ? s + NB + unit : s);
const iso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
};
function isoWeek(s: string): number {
  const t = iso(s);
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const f = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return (
    1 +
    Math.round(((t.getTime() - f.getTime()) / 864e5 - 3 + ((f.getUTCDay() + 6) % 7)) / 7)
  );
}

/** Judgement: one scale for every score (engines.md E7). */
export const MET = 70;
export const PART = 40;
export type Level = "met" | "part" | "no" | "none";
const LEVEL: Record<Level, { label: string; aria: string; tone: string }> = {
  met: { label: "raggiunto", aria: "raggiunto", tone: "var(--herb)" },
  part: { label: "in parte", aria: "in parte", tone: "var(--warn)" },
  no: { label: "no", aria: "non raggiunto", tone: "var(--tomato)" },
  none: { label: "", aria: "nessun voto", tone: "transparent" },
};
/** States with a closed meaning: pages pass the state, never the colour. */
export type State = "good" | "warn" | "bad" | "danger" | "info" | "muted";
const TONE: Record<State, string> = {
  good: "var(--herb)",
  warn: "var(--warn)",
  bad: "var(--tomato)",
  danger: "var(--tomato)",
  info: "var(--ink)",
  muted: "var(--muted)",
};

export const F = {
  n: (v: number, d = 1) => n(v, d),
  /** A number to put back in a field: no thousands dot, which a field reads as a decimal. */
  input: (v: number, d = 2) => n(v, d).replace(/\./g, ""),
  num: (v: number, unit = "") => u(n(v, dec(v, unit), unit === "€"), unit),
  signed: (v: number, unit = "") => (v > 0 ? "+" : "") + F.num(v, unit),
  approx: (v: number, unit = "") => "≈" + NB + F.num(v, unit),
  range: (a: number, b: number, unit = "") =>
    n(a, dec(a, unit)) + "–" + n(b, dec(b, unit)) + (unit ? NB + unit : ""),
  of: (v: number, t: number, unit = "") =>
    n(v, dec(v, unit)) + NB + "/" + NB + F.num(t, unit),
  /** Seconds as m:ss or h:mm:ss. */
  clock: (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.round(sec % 60);
    return (
      (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0")
    );
  },
  /** Minutes as "1 h 05" or "45 min". */
  hm: (min: number) => {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h
      ? h + NB + "h" + (m ? " " + String(m).padStart(2, "0") : "")
      : m + NB + "min";
  },
  /** A clock minute (any `DayMin`) as 24-hour "08:05". */
  time: (minute: number) => {
    const m = ((minute % 1440) + 1440) % 1440;
    return (
      String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0")
    );
  },
  day: (s: string) => {
    const t = iso(s);
    return DAYS[t.getUTCDay()] + " " + t.getUTCDate();
  },
  Day: (s: string) => {
    const d = F.day(s);
    return d[0]!.toUpperCase() + d.slice(1);
  },
  /** «gio 29»: a day in a list or a rail, where the full name would be cut. */
  dayShort: (s: string) => F.day(s).slice(0, 3) + " " + iso(s).getUTCDate(),
  DayShort: (s: string) => {
    const d = F.dayShort(s);
    return d[0]!.toUpperCase() + d.slice(1);
  },
  date: (s: string) => {
    const t = iso(s);
    return t.getUTCDate() + " " + MONTHS[t.getUTCMonth()]!.slice(0, 3);
  },
  dateLong: (s: string) => {
    const t = iso(s);
    return t.getUTCDate() + " " + MONTHS[t.getUTCMonth()];
  },
  month: (s: string) => MONTHS[iso(s).getUTCMonth()]!,
  week: (s: string) => "sett." + NB + isoWeek(s),
  letter: (s: string) => LETTER[iso(s).getUTCDay()]!,
  plural: (k: number, one: string, many: string) =>
    n(k, 0) + " " + (k === 1 ? one : many),
  level: (score: number | null | undefined): Level =>
    score === undefined || score === null
      ? "none"
      : score >= MET
        ? "met"
        : score >= PART
          ? "part"
          : "no",
  judge: (score: number | null | undefined) => {
    const l = F.level(score);
    return { level: l, cls: "k-st " + l, ...LEVEL[l] };
  },
  tone: (state: State | undefined) => (state ? TONE[state] : "var(--ink)"),
  /** Against a ceiling (sugars, salt, caffeine). */
  cap: (v: number, max: number): State =>
    v > max ? "bad" : v > 0.85 * max ? "warn" : "good",
  /** Against a target to reach (a micro, a goal). */
  reach: (v: number, t: number): State =>
    v >= t ? "good" : v >= 0.5 * t ? "warn" : "bad",
};
