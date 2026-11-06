/**
 * features/progress/steps.ts — the steps in «Gli ambiti» (the Progress
 * board) without a score: the movement dossier (draft) has not decided how
 * steps are judged, so the row says the numbers only — the period's mean
 * of the days logged, the days at the goal (its days only: weekdays for a
 * weekday goal), each day a cell of the strip. Pure.
 */
import { F, type BoxEntry } from "@lifeos/kit";
import { isoWeekday } from "@/core/engines/time";

export function stepsDomain(
  days: readonly string[],
  steps: readonly { day: string; n: number }[],
  goal: { value: number; weekdaysOnly: boolean } | null,
): BoxEntry | null {
  const by = new Map<string, number>();
  for (const s of steps) by.set(s.day, (by.get(s.day) ?? 0) + s.n);
  const logged = days.filter((d) => by.has(d));
  if (logged.length === 0) return null;
  const mean = logged.reduce((a, d) => a + by.get(d)!, 0) / logged.length;
  const counts = (d: string) => !goal?.weekdaysOnly || isoWeekday(d) <= 5;
  const goalDays = goal ? days.filter(counts) : [];
  const hit = goal ? goalDays.filter((d) => (by.get(d) ?? 0) >= goal.value).length : 0;
  return {
    fam: "habit",
    sub: "steps",
    title: "Passi",
    value: F.n(Math.round(mean / 100) * 100, 0),
    meta:
      "media di " +
      F.plural(logged.length, "giorno", "giorni") +
      (goal ? " · " + hit + " su " + goalDays.length + " a " + F.n(goal.value, 0) : "") +
      " · senza voto per ora",
    strip: days.map((d) => ({
      w: Math.max(1, Math.round(100 / days.length)),
      c: !by.has(d)
        ? "var(--hairline)"
        : goal && counts(d)
          ? F.tone(by.get(d)! >= goal.value ? "good" : "warn")
          : "var(--muted)",
    })),
  };
}
