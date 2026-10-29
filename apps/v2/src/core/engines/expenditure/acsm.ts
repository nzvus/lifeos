/**
 * E4a — walking and running by the ACSM metabolic equations (activity.md §5;
 * ACSM's Guidelines for Exercise Testing and Prescription, 11th ed.):
 *   walking  VO₂ = 3.5 + 0.1·v + 1.8·v·g
 *   running  VO₂ = 3.5 + 0.2·v + 0.9·v·g
 * v in m/min, g the incline as a fraction, VO₂ in ml/kg/min; MET = VO₂ / 3.5.
 * Running from 134 m/min (8 km/h), walking below; the equations hold for
 * 50–100 m/min walking and over 134 m/min running, so speeds between use the
 * walking line (a brisk walk or a jog: the lower, safer figure). ±10 %: the
 * equations' error for one person.
 */
import type { Range } from "./everyday";

export const RUN_FROM_M_PER_MIN = 134;
const ERROR = 0.1;

/** MET of covering `metres` in `minutes` on an incline (%), as a ±10 % range; null without both. */
export function acsmMet(
  metres: number | null | undefined,
  minutes: number | null | undefined,
  inclinePct: number | null | undefined = 0,
): Range | null {
  if (!metres || !minutes || metres <= 0 || minutes <= 0) return null;
  const v = metres / minutes;
  const g = Math.max(0, (inclinePct ?? 0) / 100);
  const vo2 =
    v >= RUN_FROM_M_PER_MIN ? 3.5 + 0.2 * v + 0.9 * v * g : 3.5 + 0.1 * v + 1.8 * v * g;
  const met = vo2 / 3.5;
  return { low: met * (1 - ERROR), high: met * (1 + ERROR) };
}
