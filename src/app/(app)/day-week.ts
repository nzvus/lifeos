/**
 * app/(app)/day-week.ts — the day page's words for its training burn, and
 * its week read for the week panel (ADR-0047). Split out of page.tsx
 * (800-line limit).
 */
import type { ResolvedDay } from "@/core/day/resolve";
import type { DaySummary } from "@/core/nutrition/repositories/history";
import { weekContext, type WeekContext } from "@/core/nutrition/week";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { dayBurn } from "@/core/training/progress";
import { fill, type Messages } from "@/i18n";

type Range = { low: number; high: number };

/** The day's training burn as ranges: done, then with the planned sessions. */
export function burnWords(
  burn: ReturnType<typeof dayBurn>,
  locale: Locale,
  t: Messages["training"],
): { text: string; range: string | null } {
  const range = (r: Range) => ({ low: String(r.low), high: String(r.high) });
  const n = (v: number) => formatNumber(String(v), locale, 0);
  return {
    text: [
      burn.done && fill(t.burn, range(burn.done)),
      burn.withPlanned &&
        burn.withPlanned.high !== burn.done?.high &&
        fill(t.burnWithPlanned, range(burn.withPlanned)),
    ]
      .filter(Boolean)
      .join(" · "),
    range: burn.withPlanned
      ? `~${n(burn.withPlanned.low)}–${n(burn.withPlanned.high)} kcal`
      : null,
  };
}

/** The shown day in its calendar week, through the one engine's targets. */
export function weekOf(
  week: readonly DaySummary[],
  days: ReadonlyMap<string, ResolvedDay>,
  day: string,
): WeekContext {
  return weekContext(
    week.map((d) => {
      const r = days.get(d.day);
      return {
        day: d.day,
        logged: d.totals.nutrients.kcal !== "0",
        eaten: d.totals.nutrients,
        targets: r?.targets ?? null,
        proteinLow: r?.bands?.protein?.low ?? null,
      };
    }),
    day,
    days.get(day)?.energy.energy?.bmr ?? null, // the floor holds here too
  );
}
