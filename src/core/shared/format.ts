/**
 * core/shared/format.ts — numbers and money as text, in the user's language
 * ("12.5" -> "12,5" in Italian; 189 cents -> "1,89 €").
 *
 * Inputs are ALREADY-ROUNDED display strings (core/nutrition/totals.ts
 * toDisplay) or integer cents, so converting to a JS number here cannot lose
 * precision that matters: it only changes the punctuation.
 */
import type { Locale } from "./locales";

const INTL_LOCALE: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

export function formatNumber(value: string, locale: Locale, decimals = 1): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
}

export function formatCents(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
