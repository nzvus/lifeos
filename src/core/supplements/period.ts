/**
 * core/supplements/period.ts — a period of compounds (ADR-0039), PURE: the
 * caffeine of each day, its average over the days that had any, the days
 * past EFSA's 400 mg, and the days with creatine and its stores at the end.
 */
import { CAFFEINE } from "./levels";
import { supplementsDay } from "./day";
import type { TakenDose } from "./repositories/doses";

export type SupplementsPeriod = {
  caffeineByDay: Map<string, number>;
  avgMg: number | null;
  daysOver: number;
  creatineDays: number;
  saturation: number;
};

export function supplementsPeriod(
  doses: readonly TakenDose[],
  days: readonly string[],
): SupplementsPeriod {
  const inPeriod = new Set(days);
  const caffeineByDay = new Map<string, number>();
  const creatine = new Set<string>();
  for (const d of doses) {
    if (!inPeriod.has(d.day)) continue;
    if (d.compound === "caffeine")
      caffeineByDay.set(d.day, (caffeineByDay.get(d.day) ?? 0) + d.amount);
    else creatine.add(d.day);
  }
  const values = [...caffeineByDay.values()];
  const last = days.at(-1)!;
  return {
    caffeineByDay,
    avgMg: values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : null,
    daysOver: values.filter((v) => v > CAFFEINE.dayLimitMg).length,
    creatineDays: creatine.size,
    saturation: supplementsDay({
      doses,
      day: last,
      now: Date.parse(`${last}T23:59:00Z`),
      bedtime: null,
    }).creatine.saturation,
  };
}
