/**
 * core/supplements/levels.ts — how much of a compound is in the body
 * (ADR-0039). Estimates from textbook models, labelled as such. PURE.
 *
 * Caffeine — one compartment, first-order absorption and elimination:
 *   absorbed in ~45–60 min (ka = 4 /h), half-life ~5 h in healthy adults
 *   (ke = ln 2 / 5). The amount in the body t hours after a dose D:
 *     D · ka / (ka − ke) · (e^(−ke·t) − e^(−ka·t))
 *   EFSA: up to 400 mg a day is safe for healthy adults; around 200 mg in
 *   one go; and a few hours before bed it can shorten and lighten sleep.
 *
 * Creatine — muscle stores, as a share of the extra they can hold (0–1):
 *   3–5 g a day fill them in ~28 days; without it they go back in ~5 weeks.
 *   A day with ≥ 3 g adds 1/28, less adds in proportion, a day without any
 *   takes 1/35 away. A simple straight-line model of a curved reality.
 */

export const CAFFEINE = {
  ka: 4,
  ke: Math.LN2 / 5,
  /** EFSA: a day's safe total for healthy adults, mg. */
  dayLimitMg: 400,
  /** Above this at bedtime, sleep may suffer (an indicative threshold), mg. */
  bedtimeMg: 50,
} as const;

export const CREATINE = {
  /** A day's dose that counts as full, g. */
  fullDoseG: 3,
  fillDays: 28,
  emptyDays: 35,
} as const;

export type Dose = { at: number; amount: number };

/** Caffeine in the body (mg) at instant `t` (ms), from doses (ms, mg). */
export function caffeineAt(doses: readonly Dose[], t: number): number {
  const { ka, ke } = CAFFEINE;
  let sum = 0;
  for (const d of doses) {
    const h = (t - d.at) / 3_600_000;
    if (h < 0) continue;
    sum += ((d.amount * ka) / (ka - ke)) * (Math.exp(-ke * h) - Math.exp(-ka * h));
  }
  return sum;
}

/**
 * Creatine saturation (0–1) at the end of each day, from the grams taken
 * per day ("YYYY-MM-DD" → g), over `days` (oldest first); the first day
 * starts empty, so pass enough history (90 days covers the fill and empty).
 */
export function creatineSaturation(
  grams: ReadonlyMap<string, number>,
  days: readonly string[],
): number[] {
  const { fullDoseG, fillDays, emptyDays } = CREATINE;
  let s = 0;
  return days.map((d) => {
    const g = grams.get(d) ?? 0;
    s = g > 0 ? s + Math.min(1, g / fullDoseG) / fillDays : s - 1 / emptyDays;
    s = Math.min(1, Math.max(0, s));
    return s;
  });
}
