/**
 * features/progress/goals.ts — a goal in words (V-09): what it asks
 * ("almeno 8.000 passi al giorno, nei giorni feriali"), from its metric as
 * the converter kept it. Pure.
 */
import { F } from "@lifeos/kit";
import type { Goal } from "@/core/goals";

const PER: Record<string, string> = {
  day: "al giorno",
  week: "a settimana",
  month: "al mese",
};

export function goalTitle(g: Goal): string {
  const what = typeof g.metric["what"] === "string" ? g.metric["what"] : null;
  if (g.source === "weight") return "Peso";
  if (g.source === "weightRatePctWeek") return "Ritmo del peso";
  return what ? what[0]!.toUpperCase() + what.slice(1) : g.source;
}

export function goalText(g: Goal): string {
  const unit =
    g.source === "weight"
      ? "kg"
      : g.source === "weightRatePctWeek"
        ? "% a settimana"
        : "";
  const u = typeof g.metric["unit"] === "string" ? g.metric["unit"] : unit;
  const n = (x: number | null) => (x === null ? "?" : F.n(x, x % 1 === 0 ? 0 : 2));
  const amount =
    g.target === "range"
      ? "tra " + n(g.low) + " e " + n(g.high)
      : (g.target === "at_most"
          ? "al massimo "
          : g.target === "reach"
            ? "arrivare a "
            : "almeno ") + n(g.value);
  const per = typeof g.metric["per"] === "string" ? PER[g.metric["per"]] : undefined;
  const days = g.metric["days"] === "weekdays" ? ", nei giorni feriali" : "";
  const by = g.by ? " entro il " + F.date(g.by) : "";
  return [amount, u, per].filter(Boolean).join(" ") + days + by;
}

/** The pace a weight goal asks, in kg and % of today's weight a week; null without a date or a value. */
export function neededPace(
  nowKg: number | null,
  value: string,
  by: string,
  today: string,
): { kgWeek: number; pctWeek: number } | null {
  const target = Number(value.trim().replace(",", "."));
  if (nowKg === null || !Number.isFinite(target) || target <= 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(by) || by <= today) return null;
  const weeks = (Date.parse(by) - Date.parse(today)) / (7 * 864e5);
  const kgWeek = (target - nowKg) / weeks;
  return { kgWeek, pctWeek: (kgWeek / nowKg) * 100 };
}
