/**
 * core/training/context.ts — what came before a session (dossiers/training.md
 * §4–§6), from the days the timeline holds; shown beside the session, never
 * folded into its numbers:
 *   sleep       the night that ended in the 18 h before the start
 *   intake      kcal eaten in the 24 h before, carbs in the 3 h before
 *   caffeine    coffees in the 3 h before (lines named coffee, espresso…;
 *               ~3–6 mg/kg ~60 min before helps a little, Grgic 2018)
 *   creatine    days of the last 28 with ≥ 3 g (stores fill in ~4 weeks at
 *               3–5 g a day, ISSN 2017); null when none was ever logged
 *   readiness   what the person said at the start (1–5)
 * Pure.
 */
import type { Day, DayItem } from "../day";
import { addDays, type IsoDate } from "../engines/time";
import { lineTotals } from "../food/totals";

export type SessionContext = {
  sleptMin: number | null;
  kcal24h: number | null;
  carbs3h: number | null;
  coffees3h: number;
  creatineDays: number | null;
  readiness: number | null;
};

const H = 3600_000;
const COFFEE = /\b(caff[eèé]|espresso|coffee|cappuccin|moka|americano)/i;
const CREATINE = /creatin/i;
const CREATINE_MIN_G = 3;
const CREATINE_DAYS = 28;

const meals = (days: readonly Day[]) =>
  days
    .flatMap((d) => [...d.timed, ...d.untimed])
    .filter((i) => i.kind.key === "meal" && i.status === "done");
const servingsOf = (m: DayItem) =>
  typeof m.values["servings"] === "string" ? (m.values["servings"] as string) : null;

export function sessionContext(
  days: readonly Day[],
  start: Date,
  sessionDay: IsoDate,
  readiness: number | null,
): SessionContext {
  const t = start.getTime();
  const items = days.flatMap((d) => [...d.timed, ...d.untimed]);
  const night = items
    .filter(
      (i) =>
        i.kind.key === "sleep" &&
        i.start &&
        i.end &&
        i.end.getTime() <= t &&
        i.end.getTime() > t - 18 * H,
    )
    .sort((a, b) => b.end!.getTime() - a.end!.getTime())[0];
  const before = (m: DayItem, hours: number) =>
    m.start !== null && m.start.getTime() < t && m.start.getTime() >= t - hours * H;
  const all = meals(days);
  const sum = (ms: readonly DayItem[], field: string) =>
    ms.length
      ? ms.reduce((a, m) => a + Number(lineTotals(m.lines, servingsOf(m))[field] ?? 0), 0)
      : null;
  const recent = all.filter((m) => before(m, 3));
  const from = addDays(sessionDay, -(CREATINE_DAYS - 1));
  const creatineDays = new Set<string>();
  let anyCreatine = false;
  for (const d of days) {
    if (d.day < from || d.day > sessionDay) continue;
    for (const m of meals([d]))
      for (const l of m.lines)
        if (CREATINE.test(l.name)) {
          anyCreatine = true;
          const g = Number(l.quantity) * Number(servingsOf(m) ?? 1);
          if (l.unit === "g" && g >= CREATINE_MIN_G) creatineDays.add(d.day);
        }
  }
  return {
    sleptMin: night
      ? Math.round((night.end!.getTime() - night.start!.getTime()) / 60_000)
      : null,
    kcal24h: sum(
      all.filter((m) => before(m, 24)),
      "kcal",
    ),
    carbs3h: sum(recent, "carbs"),
    coffees3h: recent.reduce(
      (n, m) => n + m.lines.filter((l) => COFFEE.test(l.name)).length,
      0,
    ),
    creatineDays: anyCreatine ? creatineDays.size : null,
    readiness,
  };
}
