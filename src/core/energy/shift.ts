/**
 * core/energy/shift.ts — a check-in week shifted by day (ADR-0044). Pure.
 *
 * Each day's program may ask for ± kcal (e.g. +300 on leg days). The week
 * keeps its total: each day gets its program's shift minus the mean shift
 * of the 7 days, so the deltas add up to zero. A week where every day asks
 * the same is uniform again. The carbs take the delta (ADR-0040: carbs
 * take the rest); protein and fat stay as the week's.
 */

/** Per-day deltas (kcal) that add up to zero; only days that differ. */
export function weekShifts(
  days: readonly { day: string; shiftKcal: number }[],
): Map<string, number> {
  const out = new Map<string, number>();
  if (!days.length) return out;
  const mean = days.reduce((a, d) => a + d.shiftKcal, 0) / days.length;
  const raw = days.map((d) => ({ day: d.day, delta: Math.round(d.shiftKcal - mean) }));
  // Rounding may leave a few kcal: give them to the largest delta.
  const rest = raw.reduce((a, d) => a + d.delta, 0);
  if (rest !== 0) {
    const biggest = raw.reduce((a, d) => (Math.abs(d.delta) > Math.abs(a.delta) ? d : a));
    biggest.delta -= rest;
  }
  for (const d of raw) if (d.delta !== 0) out.set(d.day, d.delta);
  return out;
}

/** A frozen week's numbers on a day with its delta: carbs take it. */
export function shiftDay<T extends { kcal: number; carbs: number }>(
  base: T,
  delta: number,
): T {
  if (delta === 0) return base;
  return {
    ...base,
    kcal: base.kcal + delta,
    carbs: Math.max(0, base.carbs + Math.round(delta / 4)),
  };
}

/** Deltas raised where a day would fall under the floor (kcal). */
export function floorShifts(
  shifts: ReadonlyMap<string, number>,
  baseKcal: number,
  floor: number,
): Record<string, number> {
  return Object.fromEntries(
    [...shifts].map(([day, delta]) => [day, Math.max(delta, floor - baseKcal)]),
  );
}
