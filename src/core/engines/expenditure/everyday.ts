/**
 * E4a The expenditure prior — the everyday part (engines.md E4, E4a): BMR,
 * the everyday factor from time on one's feet, steps by cadence band. Every
 * figure is a low–high range (no falsely precise burn numbers). These are
 * priors: E4's filter corrects them from the weight trend.
 */

export type Range = { low: number; high: number };
export type Sex = "male" | "female";

export const mid = (r: Range) => (r.low + r.high) / 2;
export const range = (a: number, b: number): Range => ({
  low: Math.min(a, b),
  high: Math.max(a, b),
});
export const add = (...rs: Range[]): Range => ({
  low: rs.reduce((s, r) => s + r.low, 0),
  high: rs.reduce((s, r) => s + r.high, 0),
});
export const scale = (r: Range, k: number): Range => range(r.low * k, r.high * k);

/** BMR, kcal/day: Katch-McArdle with a body fat %, else Mifflin-St Jeor. */
export function bmr(p: {
  sex: Sex;
  kg: number;
  heightCm: number;
  age: number;
  bodyFatPct?: number | null | undefined;
}): number {
  if (p.bodyFatPct != null) return 370 + 21.6 * p.kg * (1 - p.bodyFatPct / 100);
  return 10 * p.kg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);
}

/**
 * The everyday factor (× BMR) by hours on one's feet, steps NOT included (they count apart).
 * v1's three levels (ADR-0051: ~2, ~5, ~8 hours; FAO/WHO bands without walking) become
 * points of a line: between them the factor is interpolated, beyond them it stays.
 */
const FEET: readonly [hours: number, low: number, high: number][] = [
  [2, 1.15, 1.25],
  [5, 1.2, 1.32],
  [8, 1.27, 1.42],
];

export function everydayFactor(hoursOnFeet: number): Range {
  const h = Math.min(FEET.at(-1)![0], Math.max(FEET[0]![0], hoursOnFeet));
  const i = Math.max(0, FEET.findIndex(([x], j) => j > 0 && h <= x) - 1);
  const [x0, l0, h0] = FEET[i]!;
  const [x1, l1, h1] = FEET[i + 1]!;
  const t = (h - x0) / (x1 - x0);
  return { low: l0 + t * (l1 - l0), high: h0 + t * (h1 - h0) };
}

/** Hours on one's feet from the day's blocks (work, study, commute…), each seated or standing by its day type. */
export function hoursOnFeet(
  blocks: readonly { minutes: number; onFeet: number }[],
): number {
  return blocks.reduce(
    (a, b) => a + (b.minutes * Math.min(1, Math.max(0, b.onFeet))) / 60,
    0,
  );
}

/**
 * Steps by cadence band (Tudor-Locke 2018), net of one MET, by body mass:
 * incidental bouts under 100 steps/min at 2.0–2.5 MET; walks of 100 or more at 3.0–3.8.
 */
export const INCIDENTAL_MET: Range = { low: 2.0, high: 2.5 };
export const WALK_MET: Range = { low: 3.0, high: 3.8 };
/** Cadences used to turn steps into minutes when only counts are known (assumed mid-band). */
const INCIDENTAL_CADENCE = 70;
const WALK_CADENCE = 110;
export const BRISK_CADENCE = 100;

export type Steps =
  /** The phone's minute counts: each minute's steps. */
  | { type: "minutes"; perMinute: readonly number[] }
  /** A day's count, and the share of it in bouts of ≥ 10 min (walks). */
  | { type: "total"; steps: number; walkShare: number };

/** Minutes walking and minutes of incidental steps. */
export function cadenceBands(s: Steps): { walkMin: number; incidentalMin: number } {
  if (s.type === "minutes") {
    const active = s.perMinute.filter((n) => n > 0);
    return {
      walkMin: active.filter((n) => n >= BRISK_CADENCE).length,
      incidentalMin: active.filter((n) => n < BRISK_CADENCE).length,
    };
  }
  const share = Math.min(1, Math.max(0, s.walkShare));
  return {
    walkMin: (s.steps * share) / WALK_CADENCE,
    incidentalMin: (s.steps * (1 - share)) / INCIDENTAL_CADENCE,
  };
}

/** What a MET band costs over resting for some minutes: (MET − 1) × kg × hours. */
export const netKcal = (met: Range, kg: number, minutes: number): Range =>
  range((met.low - 1) * kg * (minutes / 60), (met.high - 1) * kg * (minutes / 60));

export function stepsKcal(s: Steps, kg: number): Range {
  const b = cadenceBands(s);
  return add(
    netKcal(WALK_MET, kg, b.walkMin),
    netKcal(INCIDENTAL_MET, kg, b.incidentalMin),
  );
}

/**
 * The thermic effect of food, ≈ 10 % of intake. The everyday factor already holds it
 * (factors are measured total expenditure ÷ BMR, v1 ADR-0021): it is shown as a part
 * "of which", never added.
 */
export const TEF_SHARE: Range = { low: 0.08, high: 0.12 };
