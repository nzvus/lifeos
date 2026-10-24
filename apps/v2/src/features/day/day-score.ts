/**
 * features/day/day-score.ts — the day's score (E7 `DAY`, dossiers/ranges.md
 * §5): the skyline behind «Il giorno» and the week strip's bars.
 *   dayTargets  the mean of each macro's and limit's zone score (a limit by
 *               its week's mean), the micros counting as one (their
 *               mean); null without food logged. A day still going is
 *               judged on what was eaten plus what is planned, and only for
 *               what goes over (§7)
 *   recovery    the night's score, 0–1
 *   habits      of what was planned (from a model, or folded into what was
 *               done), meals and drinks apart, the share done; a day still going counts only what
 *               is due by now
 * Built from the day box's data (`presentDay`), so the bars and the score
 * read the same numbers.
 */
import type { BoxEntry, HeatZone, NutrientsData } from "@lifeos/kit";
import type { Day, DayItem, FoodTargets } from "@/core/day";
import { DAY, score } from "@/core/engines/judgements";
import { rangeScore, type MicroTarget } from "@/core/engines/targets";
import { addDays, type IsoDate } from "@/core/engines/time";
import { presentDay } from "./nutrients";
import { nightOf, sleepScore, type ScoreContext } from "./score";

const WORDS: Record<string, string> = {
  dayTargets: "obiettivi del giorno",
  recovery: "recupero",
  habits: "abitudini",
};

const mean = (xs: readonly number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

export function targetsPart(n: NutrientsData | null, ongoing: boolean): number | null {
  if (!n || !((n.kcal?.v ?? 0) > 0)) return null;
  const judge = (v: number, zones: HeatZone[] | undefined) =>
    zones?.length ? [rangeScore(v, { unit: "", source: "", zones }, ongoing)] : [];
  const groups = n.micros?.groups ?? [];
  const micros = mean(
    groups
      .filter((g) => g.name !== "Altro")
      .flatMap((g) => g.items.flatMap((i) => judge(i.v, i.zones))),
  );
  // «Altro» (caffeine) counts on its own, not as a micro.
  const others = groups
    .filter((g) => g.name === "Altro")
    .flatMap((g) => g.items.flatMap((i) => judge(i.v, i.zones)));
  return mean([
    ...others,
    // A day still going: what was eaten plus what is planned for the rest of it.
    ...n.macros.flatMap((m) => judge(m.v + (ongoing ? (m.planned ?? 0) : 0), m.zones)),
    // A limit by its week's mean when there is one (dossiers/ranges.md §5).
    ...(n.limits ?? []).flatMap((l) =>
      judge(l.mean ?? l.v + (ongoing ? (l.planned ?? 0) : 0), l.zones),
    ),
    ...(micros === null ? [] : [micros]),
  ]);
}

/** Meals and drinks are judged by the food's score; v1's planned meals were never ticked (the eaten ones were logged apart). */
const NOT_HABITS = new Set(["meal", "water"]);
const planned = (i: DayItem) =>
  !NOT_HABITS.has(i.kind.key) &&
  (i.status === "planned" ||
    i.status === "skipped" ||
    i.fulfils !== null ||
    i.source === "template");

/** `now`: the minute of the day while it is going; null for a day that is over. */
export function habitsPart(items: readonly DayItem[], now: number | null): number | null {
  const due = items.filter(
    (i) =>
      planned(i) &&
      (now === null || i.status !== "planned" || (i.minute !== null && i.minute <= now)),
  );
  return due.length ? due.filter((i) => i.status === "done").length / due.length : null;
}

export function dayScore(p: {
  day: Day;
  nutrients: NutrientsData | null;
  /** The night's score, 0–100; null without one. */
  night: number | null;
  now: number | null;
}): BoxEntry["score"] | undefined {
  const s = score(DAY, {
    dayTargets: targetsPart(p.nutrients, p.now !== null),
    recovery: p.night === null ? null : p.night / 100,
    habits: habitsPart([...p.day.timed, ...p.day.untimed], p.now),
  });
  if (s.value === null) return undefined;
  return {
    value: s.value,
    parts: s.parts.map((q) => ({
      name: WORDS[q.key] ?? q.key,
      score: q.score,
      weight: q.weight,
    })),
    missing: s.missing.map((k) => WORDS[k] ?? k),
  };
}

/** The reference weight on a day: the mean of the weigh-ins of the 7 days up to it. */
export function weightOn(
  weighings: readonly { day: IsoDate; kg: number }[],
  day: IsoDate,
): number | null {
  return mean(
    weighings.filter((w) => w.day > addDays(day, -7) && w.day <= day).map((w) => w.kg),
  );
}

type Present = NonNullable<ReturnType<typeof presentDay>>;

/**
 * Every loaded day's box data (`presentDay`), each with its own targets and
 * reference weight; each limit carries its mean over the 7 days up to that
 * one with food logged, of the days loaded (dossiers/ranges.md §5: limits are judged on
 * the mean, the day's own value shown beside it).
 */
export function presentWeek(p: {
  days: readonly Day[];
  targets: ReadonlyMap<IsoDate, FoodTargets | null>;
  estimates: ReadonlyMap<string, Record<string, string>>;
  micros: readonly MicroTarget[] | null;
  weighings: readonly { day: IsoDate; kg: number }[];
}): Map<IsoDate, Present> {
  const out = new Map<IsoDate, Present>();
  for (const d of p.days) {
    const x = presentDay(
      d,
      p.targets.get(d.day) ?? null,
      p.estimates,
      p.micros,
      weightOn(p.weighings, d.day),
    );
    if (x) out.set(d.day, x);
  }
  const fed = [...out.entries()].filter(([, x]) => (x.nutrients.kcal?.v ?? 0) > 0);
  for (const [day, x] of out) {
    // The 7 days up to this one (dossiers/ranges.md §5), of the days loaded.
    const before = fed
      .filter(([d]) => d <= day && d > addDays(day, -7))
      .map(([, y]) => y.nutrients.limits ?? []);
    if (before.length < 2) continue;
    x.nutrients.limits = (x.nutrients.limits ?? []).map((l) => {
      const vs = before.flatMap((ls) =>
        ls.filter((o) => o.key === l.key).map((o) => o.v),
      );
      return vs.length ? { ...l, mean: mean(vs)!, meanDays: vs.length } : l;
    });
  }
  return out;
}

/**
 * Each day's score, the days up to today, from its box's data, its night and
 * its plan. `ctx` is the viewed day's; each day gets its own date and, for
 * today, the minute now. The week strip reads their values; Andamento the
 * whole scores (the period's mean, its parts).
 */
export function dayScores(p: {
  days: readonly Day[];
  present: ReadonlyMap<IsoDate, Present>;
  ctx: ScoreContext;
  today: IsoDate;
  nowMinute: number | null;
}): Map<IsoDate, NonNullable<BoxEntry["score"]>> {
  const out = new Map<IsoDate, NonNullable<BoxEntry["score"]>>();
  for (const d of p.days) {
    if (d.day > p.today) continue;
    const items = [...d.timed, ...d.untimed];
    const now = d.day === p.today ? p.nowMinute : null;
    const c: ScoreContext = { ...p.ctx, date: d.day, now };
    const night = nightOf(items);
    const s = dayScore({
      day: d,
      nutrients: p.present.get(d.day)?.nutrients ?? null,
      night: night ? (sleepScore(night, items, c)?.value ?? null) : null,
      now,
    });
    if (s && s.value !== null) out.set(d.day, s);
  }
  return out;
}

/** The week strip's bars: each day's score value. */
export function weekScores(p: Parameters<typeof dayScores>[0]): Record<IsoDate, number> {
  return Object.fromEntries([...dayScores(p)].map(([d, s]) => [d, s.value!]));
}
