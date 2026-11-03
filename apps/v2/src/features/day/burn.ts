/**
 * features/day/burn.ts — the day's energy in words (dossiers/energy-day.md
 * §6): a session's or the steps' burn as a pill on its row, the day's line
 * «finora · a fine giornata» on its box, hours on feet with their band.
 * Ranges rounded to 10 kcal: never a falsely precise burn. Pure.
 *
 * Calibrated (ledger BODY-30, his pick 3 Nov «un numero tarato»): when the
 * week has learnt the expenditure from the weigh-ins and what was eaten, a
 * day reads as one number, its priors × k (k = learnt ÷ the same week's
 * priors), with the week's ± in proportion; every piece is scaled by the
 * same k, so the pieces still add up. Without a learnt week: the ranges.
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

/** The calibration of a day by its week (BODY-30). */
export type Tune = { k: number; sigmaShare: number };
/** Beyond these the priors or the learnt value are wrong, not the day: no calibration. */
const K_MIN = 0.6;
const K_MAX = 1.6;

/** k = learnt ÷ priors of the same week, and its ± as a share; null without both. */
export function tuneOf(
  basis:
    | { expenditureKcal?: number; sigmaKcal?: number; priorKcal?: number }
    | null
    | undefined,
): Tune | null {
  const e = basis?.expenditureKcal;
  const prior = basis?.priorKcal;
  if (!e || !prior) return null;
  const k = e / prior;
  if (!(k >= K_MIN && k <= K_MAX)) return null;
  return { k, sigmaShare: (basis?.sigmaKcal ?? 0) / e };
}

const one = (r: Range, t: Tune) => ten(((r.low + r.high) / 2) * t.k);

/** «≈ 250–380 kcal», or «≈ 310 kcal» calibrated; nothing under 10 kcal. */
export function burnText(
  r: Range | null | undefined,
  tune: Tune | null = null,
): string | null {
  if (!r || r.high < 10) return null;
  if (tune) return "≈ " + F.num(one(r, tune), "kcal");
  const m = (r.low + r.high) / 2;
  const lo = ten(Math.min(r.low, m * (1 - SPREAD)));
  const hi = ten(Math.max(r.high, m * (1 + SPREAD)));
  return "≈ " + (lo === hi ? F.num(lo, "kcal") : F.range(lo, hi, "kcal"));
}

/** A piece added to the day: «+ 240–400 kcal» (the head says it is an estimate). */
const plus = (r: Range | null | undefined, tune: Tune | null = null): string =>
  "+ " + (burnText(r, tune) ?? "≈ 0 kcal").slice(2);

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
  tune: Tune | null = null,
): string {
  const p = d.prior;
  const whole = burnText(p.total, tune)!;
  const feet =
    F.num(d.feet.hours, "h") +
    " in piedi" +
    (d.feet.source === "median" || d.feet.source === "default" ? " (stima)" : "") +
    ", " +
    feetLabel(d.feet.hours);
  const tuned = tune ? " · tarato sulle tue pesate (× " + F.n(tune.k, 2) + ")" : "";
  if (elapsed === null || elapsed >= 1) return "Speso " + whole + " · " + feet + tuned;
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
      ? burnText(
          {
            low: p.total.low + planned.prior.low,
            high: p.total.high + planned.prior.high,
          },
          tune,
        )! +
        " con " +
        F.plural(planned.count, "sessione prevista", "sessioni previste")
      : whole;
  return (
    "Speso finora " +
    burnText(sofar, tune) +
    " · a fine giornata " +
    end +
    " · " +
    feet +
    tuned
  );
}

/** The day's total for the fold's head: «≈ 2.850 kcal ± 280» calibrated, else «≈ 2.620–3.550 kcal». */
export function dayTotalText(d: PricedDay, tune: Tune | null = null): string {
  const t = burnText(d.prior.total, tune) ?? "";
  if (!tune || !t || tune.sigmaShare <= 0) return t;
  return t + " ± " + F.num(ten(one(d.prior.total, tune) * tune.sigmaShare), "");
}

/**
 * The pieces of the day (energy-day.md §6), adding up to its total: base,
 * the everyday part from the hours on feet, steps, training (× 0.75: the
 * person compensates part of it), digesting.
 */
export function dayPieces(d: PricedDay, tune: Tune | null = null): BoxEntry[] {
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
      F.num(tune ? ten(p.bmr * tune.k) : Math.round(p.bmr), "kcal"),
      "peso, altezza, età",
    ),
    row(
      "day",
      undefined,
      "La giornata",
      plus(everyday, tune),
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
            plus(p.steps, tune),
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
            plus(p.training, tune),
            "le sessioni × 0,75: dopo, il corpo compensa una parte (si muove meno)",
          ),
        ]
      : []),
    ...(p.tef
      ? [
          row(
            "food",
            "lunch",
            "Digerire",
            plus(p.tef, tune),
            "≈ 10 % di ciò che hai mangiato",
          ),
        ]
      : []),
  ];
}
