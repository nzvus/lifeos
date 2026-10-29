/**
 * features/day/burn.ts — the day's energy in words (dossiers/energy-day.md
 * §6): a session's or the steps' burn as a pill on its row, the day's line
 * «finora · a fine giornata» on its box, hours on feet with their band.
 * Ranges rounded to 10 kcal: never a falsely precise burn. Pure.
 */
import { F } from "@lifeos/kit";
import { feetLabel, type PricedDay } from "@/core/energy";
import type { Range } from "@/core/engines/expenditure";

const ten = (v: number) => Math.round(v / 10) * 10;

/** Any one day's burn is ±15–25 % (energy-day.md §3): a range never narrower than ±15 %. */
const SPREAD = 0.15;

/** «≈ 250–380 kcal»; nothing under 10 kcal. */
export function burnText(r: Range | null | undefined): string | null {
  if (!r || r.high < 10) return null;
  const m = (r.low + r.high) / 2;
  const lo = ten(Math.min(r.low, m * (1 - SPREAD)));
  const hi = ten(Math.max(r.high, m * (1 + SPREAD)));
  return "≈ " + (lo === hi ? F.num(lo, "kcal") : F.range(lo, hi, "kcal"));
}

/** Each row's burn: a session's own cost by id (before the day's compensation), the steps under "steps". */
export function rowBurns(d: PricedDay): Map<string, Range> {
  const m = new Map<string, Range>(d.sessions.map((s) => [s.id, s.burn]));
  if (d.prior.steps) m.set("steps", d.prior.steps);
  return m;
}

/**
 * The day's line. `elapsed` (0–1) is the share of the day gone: today «finora»
 * counts the everyday part up to now plus what was done, then the whole day;
 * a past day only its total.
 */
export function dayBurnLine(d: PricedDay, elapsed: number | null): string {
  const p = d.prior;
  const whole = burnText(p.total)!;
  const feet =
    F.num(d.feet.hours, "h") +
    " in piedi" +
    (d.feet.source === "said" ? "" : " (stima)") +
    ", " +
    feetLabel(d.feet.hours);
  if (elapsed === null || elapsed >= 1) return "Speso " + whole + " · " + feet;
  const t = Math.min(1, Math.max(0, elapsed));
  const more = {
    low: (p.steps?.low ?? 0) + p.training.low,
    high: (p.steps?.high ?? 0) + p.training.high,
  };
  const sofar = {
    low: p.baseline.low * t + more.low,
    high: p.baseline.high * t + more.high,
  };
  return "Speso finora " + burnText(sofar) + " · a fine giornata " + whole + " · " + feet;
}
