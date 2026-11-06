/**
 * core/food/creatine.ts — the muscle's creatine stores day by day
 * (dossiers/compounds.md §5, ledger FOOD-40): they fill in 3–4 weeks at
 * 3–5 g a day, in days at 20 g, and empty in 4–6 weeks after stopping
 * (Hultman 1996, ISSN 2017). A model fitted to those, said as «≈». Pure.
 *
 *   E_max = 0,35 g/kg × weight          (≈ the +20 % of muscle creatine measured)
 *   S_t   = min(1, S_{t−1} × (1 − k) + r × dose_t ÷ E_max),  S_0 = 0
 *   k = 0,06 / day (washout), r = 0,5 (share of a dose retained while filling)
 */
import { addDays, type IsoDate } from "../engines/time";

export const CREATINE_K = 0.06;
export const CREATINE_R = 0.5;
export const CREATINE_G_PER_KG = 0.35;
/** Days read before the day, so the stores' history settles (0,94^60 ≈ 2 %). */
export const CREATINE_WINDOW = 60;

export type CreatineState = {
  /** 0–1: how full the stores are. */
  stores: number;
  /** Today against yesterday. */
  trend: "up" | "down" | "full" | "empty";
  /** Days since the last dose (0 = taken today); null when never taken in the window. */
  sinceDose: number | null;
};

/** The stores on `day` from the grams taken each day of the window before it. */
export function creatineOn(
  doses: ReadonlyMap<IsoDate, number>,
  day: IsoDate,
  weightKg: number,
): CreatineState | null {
  if (doses.size === 0) return null;
  const max = CREATINE_G_PER_KG * weightKg;
  let s = 0;
  let before = 0;
  let last: IsoDate | null = null;
  for (let i = CREATINE_WINDOW; i >= 0; i--) {
    const d = addDays(day, -i);
    const g = doses.get(d) ?? 0;
    if (g > 0) last = d;
    before = s;
    s = Math.min(1, s * (1 - CREATINE_K) + (CREATINE_R * g) / max);
  }
  if (last === null) return null;
  const since = Math.round((Date.parse(day) - Date.parse(last)) / 86_400_000);
  const trend = s >= 0.995 ? "full" : s < 0.05 ? "empty" : s >= before ? "up" : "down";
  return { stores: s, trend, sinceDose: since };
}

/** «scorte ≈ 76 % · in aumento», «… · in calo da 3 giorni», «… piene». */
export function creatineWords(c: CreatineState): string {
  const pct = "scorte ≈ " + Math.round(c.stores * 100) + " %";
  switch (c.trend) {
    case "full":
      return "scorte piene";
    case "empty":
      return (
        "scorte quasi vuote" +
        (c.sinceDose ? " · ultima dose " + c.sinceDose + " giorni fa" : "")
      );
    case "up":
      return pct + " · in aumento";
    case "down":
      return (
        pct +
        " · in calo" +
        (c.sinceDose
          ? " da " + (c.sinceDose === 1 ? "1 giorno" : c.sinceDose + " giorni")
          : "")
      );
  }
}

/** A logged line's creatine: its food's grams per 100 × the line's quantity × the meal's servings. */
export type CreatineDoseRow = {
  day: IsoDate;
  quantity: string;
  per100: string;
  servings: string | null;
};

/** The grams taken each day, from the rows `readCreatineDoses` brings. */
export function dosesByDay(rows: readonly CreatineDoseRow[]): Map<IsoDate, number> {
  const out = new Map<IsoDate, number>();
  for (const r of rows) {
    const g = (Number(r.per100) * Number(r.quantity) * Number(r.servings ?? "1")) / 100;
    if (g > 0) out.set(r.day, (out.get(r.day) ?? 0) + g);
  }
  return out;
}
