/**
 * core/energy/weighInFacts.ts — what came before a weigh-in (ADR-0027),
 * from the food log and the training of its day and the days before.
 * Pure: the repository (repositories/energy.ts getWeighIns) gathers them;
 * core/training/weighIns.ts reads them.
 */
import type { DaySummary } from "../nutrition/repositories/history";
import { addDays, timeIn, todayIn } from "../shared/dates";
import type { Measurement } from "../training/repositories/measurements";
import type { SessionView } from "../training/repositories/sessions";
import type { WeighInFacts } from "../training/weighIns";

/** Days averaged for "the usual day" (logged days only). */
export const USUAL_DAYS = 14;

export function weighInFacts(
  m: Pick<Measurement, "day" | "createdAt" | "context">,
  historyByDay: ReadonlyMap<string, DaySummary>,
  sessions: readonly Pick<SessionView, "day" | "status" | "startedAt">[],
  timeZone: string,
): WeighInFacts {
  // When: as said; else when it was typed, if that was on its own day.
  const said = m.context?.measuredAt ?? null;
  const typedSameDay = todayIn(timeZone, m.createdAt) === m.day;
  const at = said ?? (typedSameDay ? m.createdAt : null);
  const hour = at ? Number(timeIn(at, timeZone).slice(0, 2)) : null;

  const today = historyByDay.get(m.day);
  const ateBeforeKcal = at
    ? (today?.eaten ?? [])
        .filter((e) => e.at !== null && new Date(e.at) < at)
        .reduce((a, e) => a + Number(e.kcal), 0)
    : 0;
  const trainedBefore =
    at !== null &&
    sessions.some(
      (s) =>
        s.day === m.day &&
        s.status === "done" &&
        s.startedAt &&
        new Date(s.startedAt) < at,
    );

  const macros = (d: DaySummary) => ({
    carbs: Number(d.totals.nutrients.carbs),
    salt: Number(d.totals.nutrients.salt),
  });
  const y = historyByDay.get(addDays(m.day, -1));
  const usualDays = Array.from({ length: USUAL_DAYS }, (_, i) =>
    historyByDay.get(addDays(m.day, -2 - i)),
  ).filter((d): d is DaySummary => !!d?.logged);
  const usual = usualDays.length
    ? {
        carbs: usualDays.reduce((a, d) => a + macros(d).carbs, 0) / usualDays.length,
        salt: usualDays.reduce((a, d) => a + macros(d).salt, 0) / usualDays.length,
      }
    : null;

  return {
    said: m.context
      ? {
          fasted: m.context.fasted,
          afterToilet: m.context.afterToilet,
          afterTraining: m.context.afterTraining,
        }
      : null,
    hour,
    ateBeforeKcal,
    trainedBefore,
    yesterday: y?.logged ? macros(y) : null,
    usual,
  };
}
