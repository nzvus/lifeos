/**
 * features/library/pantry.ts — the Dispensa in words (dossiers/pantry.md
 * §6): what is left, «finisce tra 3 giorni», and the typed «Comprato» /
 * «Ne ho…» checked. Pure.
 */
import Big from "big.js";
import { F } from "@lifeos/kit";
import type { Stock } from "@/core/pantry/stock";

/** «650 ml · finisce tra 4 giorni», or why there is no pace. */
export function stockWords(s: Stock, unit: string): { value: string; meta: string } {
  const left = Number(s.left);
  const value = F.num(left, unit);
  if (left === 0) return { value, meta: "finito" };
  if (s.daysLeft === null) return { value, meta: "non usato nelle ultime 4 settimane" };
  return {
    value,
    meta:
      s.daysLeft === 0
        ? "finisce oggi"
        : "finisce tra " + F.plural(s.daysLeft, "giorno", "giorni") +
          " · " + F.num(Number(s.dailyUse), unit) + " al giorno",
  };
}

/** A typed amount: "1,5" → "1.5"; empty → null; anything else → NaN. */
export function typedAmount(s: string | null | undefined): string | null | number {
  const t = (s ?? "").trim().replace(",", ".");
  if (t === "") return null;
  return /^\d{1,7}(\.\d{1,3})?$/.test(t) ? new Big(t).toString() : NaN;
}

/** A typed price in euro ("3,98") → cents; empty → null; anything else → NaN. */
export function typedCents(s: string | null | undefined): number | null {
  const a = typedAmount(s);
  if (a === null) return null;
  if (typeof a !== "string") return NaN;
  return Math.round(Number(a) * 100);
}
