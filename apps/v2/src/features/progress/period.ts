/**
 * features/progress/period.ts — Andamento's «Il periodo» (V-06, first part):
 * the same Nutrients as Oggi's day, averaged over the days of a range that
 * have something eaten (an empty day is not a day of eating nothing), and
 * one row per day: its kcal against its target. Pure: the page gives each
 * day's Nutrients as Oggi computes them.
 */
import type { NutrientsData } from "@lifeos/kit";

export type PeriodDay = { day: string; nutrients: NutrientsData | null };
export type PeriodRow = {
  day: string;
  kcal: number | null;
  t: number | null;
  protein: number | null;
};

const avg = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
const avgOrNull = (xs: readonly (number | null | undefined)[]) => {
  const ok = xs.filter((x): x is number => typeof x === "number");
  return ok.length === 0 ? null : avg(ok);
};

/** Logged = some kcal eaten. */
const logged = (d: PeriodDay): d is { day: string; nutrients: NutrientsData } =>
  (d.nutrients?.kcal?.v ?? 0) > 0;

export function period(days: readonly PeriodDay[]): {
  nutrients: NutrientsData | null;
  logged: number;
  rows: PeriodRow[];
} {
  const on = days.filter(logged);
  const rows = days.map((d) => ({
    day: d.day,
    kcal: logged(d) ? d.nutrients.kcal!.v : null,
    t: d.nutrients?.kcal?.t ?? null,
    protein: logged(d)
      ? (d.nutrients.macros.find((m) => m.key === "protein")?.v ?? 0)
      : null,
  }));
  if (on.length === 0) return { nutrients: null, logged: 0, rows };
  const first = on[0]!.nutrients;
  const limits = first.limits ?? [];
  return {
    logged: on.length,
    rows,
    nutrients: {
      kcal: {
        v: avg(on.map((d) => d.nutrients.kcal!.v)),
        t: avgOrNull(on.map((d) => d.nutrients.kcal?.t)),
      },
      macros: first.macros.map((m) => ({
        key: m.key,
        v: avg(on.map((d) => d.nutrients.macros.find((x) => x.key === m.key)?.v ?? 0)),
        t: avgOrNull(on.map((d) => d.nutrients.macros.find((x) => x.key === m.key)?.t)),
      })),
      ...(limits.length > 0
        ? {
            limits: limits.map((l) => ({
              key: l.key,
              v: avg(
                on.map((d) => d.nutrients.limits?.find((x) => x.key === l.key)?.v ?? 0),
              ),
              t:
                avgOrNull(
                  on.map((d) => d.nutrients.limits?.find((x) => x.key === l.key)?.t),
                ) ?? 0,
            })),
          }
        : {}),
    },
  };
}

export type Weighing = { day: string; kg: number };

/**
 * The period's weight: the mean of the first and of the last seven days
 * that have a weighing (one scale reading swings by a kilo), and their
 * difference; null with fewer than two weighings.
 */
export function weightChange(
  ws: readonly Weighing[],
): { from: number; to: number; delta: number; n: number } | null {
  if (ws.length < 2) return null;
  const sorted = [...ws].sort((a, b) => (a.day < b.day ? -1 : 1));
  const mean = (xs: readonly Weighing[]) => xs.reduce((a, w) => a + w.kg, 0) / xs.length;
  const head = sorted.filter((w) => w.day <= addDays(sorted[0]!.day, 6));
  const tail = sorted.filter((w) => w.day >= addDays(sorted.at(-1)!.day, -6));
  const from = mean(head);
  const to = mean(tail);
  return { from, to, delta: to - from, n: ws.length };
}

/** "2026-10-15" + n days (kept here: the page's dates are plain strings). */
function addDays(d: string, n: number): string {
  const t = new Date(d + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}
