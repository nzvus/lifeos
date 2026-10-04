/**
 * core/supplements/day.ts — a day's compounds at a glance (ADR-0039), PURE:
 *   caffeine  taken that day (against EFSA's 400 mg), in the body now, and
 *             at bedtime (against ~50 mg, the sleep threshold);
 *   creatine  taken that day, and the stores' saturation at its end.
 * `doses` should reach back ~90 days (creatine's stores remember).
 */
import { addDays } from "../shared/dates";
import { caffeineAt, CAFFEINE, creatineSaturation } from "./levels";
import type { TakenDose } from "./repositories/doses";

export type SupplementsDay = {
  /** Anything to show: a compound taken in the last 30 days. */
  any: boolean;
  caffeine: { dayMg: number; nowMg: number; bedMg: number | null; limitMg: number };
  creatine: { dayG: number; saturation: number; daysTaken30: number };
};

export function supplementsDay(input: {
  doses: readonly TakenDose[];
  day: string;
  /** The instant "now" is read at (for a past day: its end). */
  now: number;
  /** Tonight's bedtime instant, or null when unknown. */
  bedtime: number | null;
}): SupplementsDay {
  const { doses, day, now, bedtime } = input;
  const caf = doses.filter((d) => d.compound === "caffeine");
  const cre = doses.filter((d) => d.compound === "creatine");
  const sum = (xs: readonly TakenDose[]) => xs.reduce((a, d) => a + d.amount, 0);
  const pk = caf.map((d) => ({ at: d.at, amount: d.amount }));
  const days = Array.from({ length: 90 }, (_, i) => addDays(day, i - 89));
  const grams = new Map<string, number>();
  for (const d of cre) grams.set(d.day, (grams.get(d.day) ?? 0) + d.amount);
  const sat = creatineSaturation(grams, days);
  const month = new Set(days.slice(-30));
  return {
    any: doses.some((d) => month.has(d.day)),
    caffeine: {
      dayMg: Math.round(sum(caf.filter((d) => d.day === day))),
      nowMg: Math.round(caffeineAt(pk, now)),
      bedMg: bedtime === null ? null : Math.round(caffeineAt(pk, bedtime)),
      limitMg: CAFFEINE.dayLimitMg,
    },
    creatine: {
      dayG: Math.round(sum(cre.filter((d) => d.day === day)) * 10) / 10,
      saturation: sat.at(-1) ?? 0,
      daysTaken30: [...grams.keys()].filter((d) => month.has(d)).length,
    },
  };
}
