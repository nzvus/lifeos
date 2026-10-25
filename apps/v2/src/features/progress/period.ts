/**
 * features/progress/period.ts — Andamento's «Il periodo» (V-06, first part):
 * the same Nutrients as Oggi's day, averaged over the days of a range that
 * have something eaten (an empty day is not a day of eating nothing), and
 * one row per day: its kcal against its target. Pure: the page gives each
 * day's Nutrients as Oggi computes them.
 */
import { F, type NutrientsData } from "@lifeos/kit";

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
  return {
    logged: on.length,
    rows,
    nutrients: meanNutrients(on.map((d) => d.nutrients)),
  };
}

/**
 * The days' Nutrients as one (the developer, 2026-10-25: «uguale in tutte le
 * pagine»): every number averaged — kcal, each macro and each of its kinds,
 * each limit, each micro —, the zones and the words of the last day (the
 * targets the period ends with), the sources summed. So the period's panel
 * is Oggi's, read over days.
 */
export function meanNutrients(all: readonly NutrientsData[]): NutrientsData {
  const last = all.at(-1)!;
  const meanParts = (key: string) => {
    const sum = new Map<string, number>();
    for (const d of all)
      for (const [k, g] of Object.entries(
        d.macros.find((m) => m.key === key)?.parts ?? {},
      ))
        sum.set(k, (sum.get(k) ?? 0) + g);
    return sum.size
      ? Object.fromEntries([...sum].map(([k, g]) => [k, g / all.length]))
      : null;
  };
  const meanSources = (key: string) => {
    const sum = new Map<string, number>();
    for (const d of all)
      for (const [n, g] of d.macros.find((m) => m.key === key)?.sources ?? [])
        sum.set(n, (sum.get(n) ?? 0) + g);
    return [...sum]
      .map(([n, g]) => [n, g / all.length] as [string, number])
      .sort((a, b) => b[1] - a[1]);
  };
  const micros = last.micros
    ? (() => {
        const groups = last.micros!.groups.map((g) => ({
          ...g,
          items: g.items.map((it) => {
            const v = avg(
              all.map(
                (d) =>
                  d.micros?.groups.flatMap((x) => x.items).find((x) => x.name === it.name)
                    ?.v ?? 0,
              ),
            );
            const state = it.t ? F.reach(v, it.t) : undefined;
            return { ...it, v, ...(state ? { state } : {}) };
          }),
        }));
        const items = groups.flatMap((g) => g.items).filter((x) => x.t);
        return {
          summary:
            items.filter((x) => x.v >= x.t!).length +
            " su " +
            items.length +
            " coperti · media",
          groups,
        };
      })()
    : null;
  return {
    kcal: {
      v: avg(all.map((d) => d.kcal?.v ?? 0)),
      t: avgOrNull(all.map((d) => d.kcal?.t)),
    },
    macros: last.macros.map((m) => {
      const parts = meanParts(m.key);
      const sources = meanSources(m.key);
      return {
        key: m.key,
        v: avg(all.map((d) => d.macros.find((x) => x.key === m.key)?.v ?? 0)),
        t: avgOrNull(all.map((d) => d.macros.find((x) => x.key === m.key)?.t)),
        ...(parts ? { parts } : {}),
        ...(sources.length ? { sources } : {}),
        ...(m.zones ? { zones: m.zones } : {}),
        ...(m.partZones ? { partZones: m.partZones } : {}),
      };
    }),
    ...(last.limits?.length
      ? {
          limits: last.limits.map((l) => ({
            key: l.key,
            ...(l.name ? { name: l.name } : {}),
            v: avg(all.map((d) => d.limits?.find((x) => x.key === l.key)?.v ?? 0)),
            t: avgOrNull(all.map((d) => d.limits?.find((x) => x.key === l.key)?.t)) ?? 0,
            ...(l.zones ? { zones: l.zones } : {}),
          })),
        }
      : {}),
    ...(micros ? { micros } : {}),
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

export type TrainingDay = { sessions: number; workSets: number; minutes: number };

/** The period's training: sessions done, working sets (no warm-ups), minutes; per week. */
export function trainingOf(days: readonly TrainingDay[]): {
  sessions: number;
  workSets: number;
  minutes: number;
  perWeek: number;
} {
  const sum = (k: keyof TrainingDay) => days.reduce((a, d) => a + d[k], 0);
  const sessions = sum("sessions");
  return {
    sessions,
    workSets: sum("workSets"),
    minutes: sum("minutes"),
    perWeek: days.length === 0 ? 0 : (sessions * 7) / days.length,
  };
}

/**
 * The period box's pills (the Progress board): the sessions done, the
 * nights' mean sleep (warn under 7 h, the AASM/SRS adult minimum), the
 * weight from the first week's mean to the last's. Each only when known.
 */
export function periodPills(p: {
  sessions: number;
  nights: readonly { day: string; start: Date; end: Date }[];
  weight: { from: number; to: number } | null;
}): { t: string; state?: "warn"; of?: { fam: string } }[] {
  const hours = p.nights
    .map((n) => (n.end.getTime() - n.start.getTime()) / 3_600_000)
    .filter((h) => h > 0 && h < 16);
  const sleep = hours.length ? hours.reduce((a, h) => a + h, 0) / hours.length : null;
  return [
    ...(p.sessions > 0
      ? [
          {
            t: p.sessions === 1 ? "1 sessione" : p.sessions + " sessioni",
            of: { fam: "train" },
          },
        ]
      : []),
    ...(sleep !== null
      ? [
          {
            t: "sonno " + F.num(sleep, "h"),
            of: { fam: "sleep" },
            ...(sleep < 7 ? { state: "warn" as const } : {}),
          },
        ]
      : []),
    ...(p.weight
      ? [
          {
            t: "peso " + F.n(p.weight.from, 1) + " → " + F.n(p.weight.to, 1),
            of: { fam: "body" },
          },
        ]
      : []),
  ];
}
