/**
 * The day's −/+ on a meal's servings, as v1 stepped them (S-T10, ledger
 * KEEP-06): quarters below 1, halves up to 4, whole numbers after; never
 * under ¼ or over 20.
 */
const MIN = 0.25;
const MAX = 20;

export function stepServings(current: string, dir: 1 | -1): string {
  const n = Number(current);
  const v = Number.isFinite(n) && n > 0 ? n : 1;
  const step = (x: number) => (x < 1 ? 0.25 : x < 4 ? 0.5 : 1);
  // Going down, the step is the one of the value below (4 → 3,5, 1 → 0,75).
  const next = dir === 1 ? v + step(v) : v - step(v - 0.001);
  const snapped = Math.round(next / 0.25) * 0.25;
  return String(Math.min(MAX, Math.max(MIN, snapped)));
}
