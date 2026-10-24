/**
 * features/day/goal-line.ts — the weight goal in one line under Oggi's day
 * box (the boards' Main: «77,8 → 72 kg entro il 31 dic · vai a −0,4
 * kg/sett., ne servono −0,5 kg/sett.»): the last week's mean, the target,
 * the pace of the last 4 weeks and the one the date needs (core/goals
 * `weightProgress`). Pure: tested without a browser.
 */
import { F } from "@lifeos/kit";
import type { WeightProgress } from "@/core/goals";

export function goalLine(p: WeightProgress, by: string | null): string {
  const head = F.n(p.now, 1) + " → " + F.num(p.target, "kg");
  if (Math.abs(p.target - p.now) < 0.3)
    return head + " · obiettivo raggiunto: ora tenerlo";
  const when = by ? " entro il " + F.date(by) : "";
  const pace =
    p.pace === null
      ? " · servono 4 pesate in 4 settimane per il ritmo"
      : " · vai a " +
        F.signed(p.pace, "kg/sett.") +
        (p.needed !== null ? ", ne servono " + F.signed(p.needed, "kg/sett.") : "");
  return head + when + pace;
}
