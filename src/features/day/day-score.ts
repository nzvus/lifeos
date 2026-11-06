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
import { lineTotals } from "@/core/food/totals";
import type { WeightBook } from "@/core/account/weights";
import { presentDay } from "./nutrients";
import { nightOf, sleepScore, type ScoreContext } from "./score";

const WORDS: Record<string, string> = {
  dayTargets: "obiettivi del giorno",
  recovery: "recupero",
  habits: "abitudini",
  proteinSpread: "proteine distribuite",
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

/**
 * Protein spread (E7 DAY v2; Areta 2013): the day's eaten meals with at least
 * 0.3 g/kg of protein (25 g without a weight) — three or more full, two
 * two-thirds, one a third; none with fewer than two meals eaten.
 */
export function proteinSpreadPart(
  items: readonly DayItem[],
  weightKg: number | null,
): number | null {
  // A role's entries (four of «Cena») are one meal, as Oggi groups them.
  const meals = new Map<string, number>();
  for (const m of items) {
    if (m.kind.key !== "meal" || m.status !== "done") continue;
    const servings =
      typeof m.values["servings"] === "string" ? m.values["servings"] : null;
    const key = m.subcategory ?? m.id;
    meals.set(
      key,
      (meals.get(key) ?? 0) + Number(lineTotals(m.lines, servings)["protein"] ?? 0),
    );
  }
  if (meals.size < 2) return null;
  const need = weightKg ? 0.3 * weightKg : 25;
  const enough = [...meals.values()].filter((g) => g >= need).length;
  return Math.min(1, enough / 3);
}

export function dayScore(p: {
  day: Day;
  nutrients: NutrientsData | null;
  /** The night's score, 0–100; null without one. */
  night: number | null;
  now: number | null;
  /** The reference weight for the protein spread; null: 25 g a meal. */
  weightKg?: number | null;
  /** The person's weights for the scores (V-16). */
  weights?: WeightBook;
}): BoxEntry["score"] | undefined {
  const s = score(
    DAY,
    {
      dayTargets: targetsPart(p.nutrients, p.now !== null),
      recovery: p.night === null ? null : p.night / 100,
      habits: habitsPart([...p.day.timed, ...p.day.untimed], p.now),
      proteinSpread: proteinSpreadPart(
        [...p.day.timed, ...p.day.untimed],
        p.weightKg ?? null,
      ),
    },
    p.weights?.["day"],
  );
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
  /** Every weigh-in, for each day's reference weight (else the context's). */
  weighings?: readonly { day: IsoDate; kg: number }[];
}): Map<IsoDate, NonNullable<BoxEntry["score"]>> {
  const out = new Map<IsoDate, NonNullable<BoxEntry["score"]>>();
  for (const d of p.days) {
    if (d.day > p.today) continue;
    const items = [...d.timed, ...d.untimed];
    const now = d.day === p.today ? p.nowMinute : null;
    const c: ScoreContext = { ...p.ctx, date: d.day, now };
    const night = nightOf(items, c);
    const s = dayScore({
      day: d,
      nutrients: p.present.get(d.day)?.nutrients ?? null,
      night: night ? (sleepScore(night, items, c)?.value ?? null) : null,
      now,
      weightKg: weightOn(p.weighings ?? p.ctx.weighings ?? [], d.day),
      ...(p.ctx.weights ? { weights: p.ctx.weights } : {}),
    });
    if (s && s.value !== null) out.set(d.day, s);
  }
  return out;
}

/** The week strip's bars: each day's score value. */
export function weekScores(p: Parameters<typeof dayScores>[0]): Record<IsoDate, number> {
  return Object.fromEntries([...dayScores(p)].map(([d, s]) => [d, s.value!]));
}

/** One day's bars in the week strip (the developer's pick, 2026-10-25). */
export type WeekBar = {
  /** The day's food against its targets, 0–1 (its score's «obiettivi del giorno»). */
  food: number | null;
  /** The worst limit as a share of its allowance (1 = at the limit). */
  limits: number | null;
  train: "done" | "planned" | null;
  /** What was planned and got done, 0–1. */
  habits: number | null;
};

/**
 * Each day's four thin bars (food, limits, training, habits) from what the
 * week strip already reads: the day scores' parts, the days' panels, their
 * sessions. A day with nothing gives no bars.
 */
export function weekBars(p: Parameters<typeof dayScores>[0]): Record<IsoDate, WeekBar> {
  const scores = dayScores(p);
  const out: Record<IsoDate, WeekBar> = {};
  for (const d of p.days) {
    const s = scores.get(d.day);
    const part = (w: string) => s?.parts.find((x) => x.name === w)?.score ?? null;
    const lims = p.present.get(d.day)?.nutrients.limits ?? [];
    const worst = lims.length
      ? Math.max(...lims.map((l) => (l.t > 0 ? l.v / l.t : 0)))
      : null;
    const sessions = [...d.timed, ...d.untimed].filter((i) => i.kind.key === "session");
    const train = sessions.some((i) => i.status === "done")
      ? "done"
      : sessions.some((i) => i.status === "planned")
        ? "planned"
        : null;
    const bar: WeekBar = {
      food: part(WORDS.dayTargets!),
      limits: worst !== null && worst > 0 ? worst : null,
      train,
      habits: part(WORDS.habits!),
    };
    if (bar.food !== null || bar.limits !== null || bar.train || bar.habits !== null)
      out[d.day] = bar;
  }
  return out;
}
