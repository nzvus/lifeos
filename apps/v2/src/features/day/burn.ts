/**
 * features/day/burn.ts — the day's energy in words (dossiers/energy-day.md
 * §6): a session's or the steps' burn as a pill on its row, the day's line
 * «finora · a fine giornata» on its box, hours on feet with their band.
 * Ranges rounded to 10 kcal: never a falsely precise burn. Pure.
 */
import { F, type BoxEntry } from "@lifeos/kit";
import { feetLabel, type PricedDay } from "@/core/energy";
import type { Range } from "@/core/engines/expenditure";

const ten = (v: number) => Math.round(v / 10) * 10;
const FEET_SOURCE: Record<PricedDay["feet"]["source"], string> = {
  said: "",
  level: ", dal livello del giorno",
  median: ", tua mediana di 14 giorni",
  default: ", stima",
};

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

/** A piece added to the day: «+ 240–400 kcal» (the head says it is an estimate). */
const plus = (r: Range | null | undefined): string =>
  "+ " + (burnText(r) ?? "≈ 0 kcal").slice(2);

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
export function dayBurnLine(
  d: PricedDay,
  elapsed: number | null,
  planned: { count: number; prior: Range } | null = null,
): string {
  const p = d.prior;
  const whole = burnText(p.total)!;
  const feet =
    F.num(d.feet.hours, "h") +
    " in piedi" +
    (d.feet.source === "median" || d.feet.source === "default" ? " (stima)" : "") +
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
  // Planned sessions not done yet: in the day's end, said so (their sets are not known).
  const end =
    planned && planned.count > 0
      ? burnText({
          low: p.total.low + planned.prior.low,
          high: p.total.high + planned.prior.high,
        })! +
        " con " +
        F.plural(planned.count, "sessione prevista", "sessioni previste")
      : whole;
  return "Speso finora " + burnText(sofar) + " · a fine giornata " + end + " · " + feet;
}

/** The day's total in a few characters, for the fold's head: «≈ 2.620–3.550 kcal». */
export const dayTotalText = (d: PricedDay): string => burnText(d.prior.total) ?? "";

/**
 * The pieces of the day (energy-day.md §6), adding up to its total: base,
 * the everyday part from the hours on feet, steps, training (× 0.75: the
 * person compensates part of it), digesting.
 */
export function dayPieces(d: PricedDay): BoxEntry[] {
  const p = d.prior;
  const tef = p.tef ?? { low: 0, high: 0 };
  const everyday = {
    low: Math.max(0, p.baseline.low - p.bmr - tef.low),
    high: Math.max(0, p.baseline.high - p.bmr - tef.high),
  };
  const row = (
    fam: string,
    sub: string | undefined,
    title: string,
    value: string,
    meta: string,
  ): BoxEntry => ({ fam, ...(sub ? { sub } : {}), title, value, meta });
  return [
    row(
      "body",
      "weight",
      "Base (a riposo)",
      F.num(Math.round(p.bmr), "kcal"),
      "peso, altezza, età",
    ),
    row(
      "day",
      undefined,
      "La giornata",
      plus(everyday),
      F.num(d.feet.hours, "h") +
        " in piedi" +
        FEET_SOURCE[d.feet.source] +
        " · " +
        feetLabel(d.feet.hours),
    ),
    ...(p.steps
      ? [
          row(
            "habit",
            "steps",
            "Passi",
            plus(p.steps),
            "per cadenza: a passo spezzato ≈ 2–2,5 MET, camminate ≈ 3–3,8",
          ),
        ]
      : []),
    ...(p.training.high >= 10
      ? [
          row(
            "train",
            "strength",
            "Allenamento",
            plus(p.training),
            "le sessioni × 0,75: dopo, il corpo compensa una parte (si muove meno)",
          ),
        ]
      : []),
    ...(p.tef
      ? [row("food", "lunch", "Digerire", plus(p.tef), "≈ 10 % di ciò che hai mangiato")]
      : []),
  ];
}
