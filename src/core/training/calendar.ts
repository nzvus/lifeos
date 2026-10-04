/**
 * core/training/calendar.ts — the Plan tab's month (ADR-0035), PURE:
 *   - monthGrid: the weeks shown for a month, Monday first, whole weeks;
 *   - lookOf: what a routine or a session looks like everywhere — the
 *     colour of its main muscle region (by working sets, as regionSplit)
 *     and the icon of its main movement (the exercise with most sets).
 *     Derived, never stored: change the routine and its colour follows.
 */
import { addDays, startOfWeek } from "../shared/dates";
import type { MuscleRegion } from "./anatomy";
import { regionSplit } from "./display";

export type Look = {
  region: MuscleRegion | null;
  pattern: string | null;
  cardio: boolean;
};

type LookExercise = {
  kind: string;
  pattern: string | null;
  muscleGroups: readonly string[];
  /** Working sets (a routine's planned sets, or a session's done ones). */
  sets: number;
};

export function lookOf(exercises: readonly LookExercise[]): Look {
  const split = regionSplit({
    exercises: exercises.map((e) => ({
      kind: e.kind,
      muscleGroups: e.muscleGroups,
      sets: Array.from({ length: e.sets }, () => ({ warmup: false })),
    })),
  });
  const main = [...exercises].sort((a, b) => b.sets - a.sets)[0];
  const cardio = exercises.length > 0 && exercises.every((e) => e.kind === "cardio");
  return {
    // Cardio without muscle groups counts as legs in regionSplit; a cardio
    // day keeps no region colour, it has its own.
    region:
      cardio && exercises.every((e) => !e.muscleGroups.length)
        ? null
        : (split[0]?.region ?? null),
    pattern: main?.pattern ?? null,
    cardio,
  };
}

/** "2026-10" → the days shown: from the Monday of the 1st to the Sunday of the last. */
export function monthGrid(month: string): string[][] {
  const first = `${month}-01`;
  const [y, m] = month.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const weeks: string[][] = [];
  for (let d = startOfWeek(first); d <= last; d = addDays(d, 7))
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
  return weeks;
}

/** "2026-10" and a step in months → "2026-11". */
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

export const isMonth = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

export const PLAN_VIEWS = ["week", "month"] as const;
export type PlanView = (typeof PLAN_VIEWS)[number];

/** How many panels the Plan shows before and after the one with its day. */
const AROUND: Record<PlanView, { before: number; after: number }> = {
  week: { before: 4, after: 8 },
  month: { before: 2, after: 3 },
};

/**
 * The panels the Plan scrolls through around a day (ADR-0036): weeks or
 * months, each as whole weeks (Monday first). `at` is the index of the panel
 * that holds the day. Moving past the last panel reloads around a new day.
 */
export function planPanels(
  view: PlanView,
  day: string,
): { panels: { key: string; weeks: string[][] }[]; at: number } {
  const { before, after } = AROUND[view];
  const panels = [];
  for (let i = -before; i <= after; i++) {
    if (view === "month") {
      const month = shiftMonth(day.slice(0, 7), i);
      panels.push({ key: month, weeks: monthGrid(month) });
    } else {
      const monday = addDays(startOfWeek(day), 7 * i);
      panels.push({
        key: monday,
        weeks: [Array.from({ length: 7 }, (_, d) => addDays(monday, d))],
      });
    }
  }
  return { panels, at: before };
}
