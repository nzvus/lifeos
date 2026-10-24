/**
 * features/day/score.ts — the scores of the day's boxes (E7), the parts in
 * the boards' words with their weights, for the skyline and the open parts:
 * - a meal (core/food `foodParts`; dossiers/meal-score.md): none without the
 *   day's targets (no references to judge against) or under 5 kcal;
 * - a weigh-in, a night's sleep and the day's water (engines body, sleep,
 *   hydration), from the day and the few rows `ScoreContext` brings.
 * A weigh-in's reliability here leaves out yesterday's carbs and salt
 * against the usual: reading 15 days of food for one clue is not worth it.
 */
import { F, type BoxEntry } from "@lifeos/kit";
import { dayMinute, type DayItem, type FoodTargets } from "@/core/day";
import {
  readWeighIn,
  implausibleWeighIns,
  weighingParts,
  type Pace,
} from "@/core/engines/body";
import {
  dailyNeed,
  sweatL,
  waterParts,
  type Session,
  type Sex,
} from "@/core/engines/hydration";
import {
  FOOD,
  SLEEP,
  WATER,
  WEIGHING,
  score,
  type ScoringModel,
} from "@/core/engines/judgements";
import { sleepParts } from "@/core/engines/sleep";
import type { MicroTarget } from "@/core/engines/targets";
import type { DayClock, IsoDate } from "@/core/engines/time";
import { foodParts, partsOf } from "@/core/food/score";
import { lineTotals } from "@/core/food/totals";
import { weightProgress } from "@/core/goals";

const PART_WORDS: Record<string, string> = {
  density: "densità",
  limits: "limiti",
  value: "valore",
  fit: "adatto al blocco",
};
const LIMIT_WORDS: Record<string, string> = {
  sodium: "sale",
  saturated: "grassi saturi",
  freeSugars: "zuccheri liberi",
  trans: "grassi trans",
};

export function mealScore(
  meal: DayItem,
  targets: FoodTargets | null,
  estimates: ReadonlyMap<string, Record<string, string>>,
  microTargets: readonly MicroTarget[] | null,
): BoxEntry["score"] | undefined {
  if (meal.kind.key !== "meal") return undefined;
  return linesScore(
    meal.lines.map((l) => ({
      quantity: l.quantity,
      values: l.values,
      estimates: l.itemId ? estimates.get(l.itemId) : undefined,
    })),
    typeof meal.values["servings"] === "string" ? meal.values["servings"] : null,
    targets,
    microTargets,
  );
}

/**
 * A food's score (Libreria; meal-score.md §8 «Open», decided 2026-10-24): E7's
 * model is «per 100 kcal», so a food is scored on the amount that brings 100
 * kcal — a fair portion for light and dense foods alike. None under 5 kcal
 * per 100 (water, coffee), and none for herbs and spices: eaten by the gram,
 * 100 kcal of basil (435 g) would score a portion nobody eats — the known
 * weakness of per-energy density scores (Drewnowski 2009).
 */
const UNSCORED_GROUPS = new Set(["herbs"]);
export function foodScore(
  per100: Record<string, string>,
  estimates: Record<string, string> | undefined,
  targets: FoodTargets | null,
  microTargets: readonly MicroTarget[] | null,
  group?: string,
): BoxEntry["score"] | undefined {
  const kcal = Number(per100["kcal"] ?? 0);
  if (!(kcal >= 5) || (group && UNSCORED_GROUPS.has(group))) return undefined;
  return linesScore(
    [{ quantity: String(10_000 / kcal), values: per100, estimates }],
    null,
    targets,
    microTargets,
  );
}

function linesScore(
  lines: Parameters<typeof foodParts>[0],
  servings: string | null,
  targets: FoodTargets | null,
  microTargets: readonly MicroTarget[] | null,
): BoxEntry["score"] | undefined {
  if (targets === null) return undefined;
  const parts = foodParts(lines, servings, {
    kcal: targets.kcal,
    // A day without a protein or fibre target: that nutrient is left out of density.
    protein: targets.protein ?? 0,
    fibre: targets.fibre ?? 0,
    micros: Object.fromEntries((microTargets ?? []).map((t) => [t.micro, t.value])),
  });
  // Without density (too few nutrients known) only the limits would speak: «no excess» is
  // not «good food» (a cake scored 100 on them alone). No score then.
  if (!parts || parts.density === null) return undefined;
  const s = score(FOOD, partsOf(parts));
  if (s.value === null) return undefined;
  // Over its allowance: the limit that decided it, by name.
  const worst = Object.entries(parts.detail.limits).sort((a, b) => b[1] - a[1])[0];
  const over = worst && worst[1] > 1 ? " · " + (LIMIT_WORDS[worst[0]] ?? worst[0]) : "";
  return {
    value: s.value,
    parts: s.parts.map((p) => ({
      name: (PART_WORDS[p.key] ?? p.key) + (p.key === "limits" ? over : ""),
      score: p.score,
      weight: p.weight,
    })),
    missing: s.missing.map((k) => PART_WORDS[k] ?? k),
  };
}

/** What the weigh-in, sleep and water scores read beyond the day: null when not read. */
export type ScoreContext = {
  date: IsoDate;
  clock: DayClock;
  /** Weigh-ins of the 28 days up to the day, oldest first. */
  weighings: readonly { day: IsoDate; kg: number }[] | null;
  weightGoal: { value: number; since: IsoDate; by: IsoDate | null } | null;
  /** The nights of the 7 days before. */
  nights: readonly { day: IsoDate; start: Date; end: Date }[] | null;
  sex: Sex | null;
  /** The minute of the day now, when the day is today. */
  now: number | null;
};

const WEIGH_WORDS: Record<string, string> = {
  reliable: "pesata affidabile",
  pace: "ritmo vs obiettivo",
  consistency: "costanza delle pesate",
};
const SLEEP_WORDS: Record<string, string> = {
  duration: "durata vs bisogno",
  regularity: "regolarità",
  feel: "come ti senti",
};
const WATER_WORDS: Record<string, string> = {
  expected: "bevuta vs attesa a quest’ora",
  afterTraining: "dopo l’allenamento",
  spread: "distribuita nel giorno",
};

function boxScore(
  model: ScoringModel,
  parts: Readonly<Record<string, number | null>>,
  words: Record<string, string>,
): BoxEntry["score"] | undefined {
  const s = score(model, parts);
  if (s.value === null) return undefined;
  return {
    value: s.value,
    parts: s.parts.map((p) => ({
      name: words[p.key] ?? p.key,
      score: p.score,
      weight: p.weight,
    })),
    missing: s.missing.map((k) => words[k] ?? k),
  };
}

const num = (v: unknown) => (typeof v === "string" && v !== "" ? Number(v) : null);
const yes = (v: unknown) =>
  v === true || v === "true" ? true : v === false || v === "false" ? false : null;
const done = (i: DayItem) => i.status === "done";
const servingsOf = (i: DayItem) =>
  typeof i.values["servings"] === "string" ? i.values["servings"] : null;

/** The night that ends on this day, done, with both ends. */
export const nightOf = (items: readonly DayItem[]) =>
  items.find((i) => i.kind.key === "sleep" && done(i) && i.start && i.end) ?? null;

export function weighScore(
  w: DayItem,
  items: readonly DayItem[],
  ctx: ScoreContext,
): BoxEntry["score"] | undefined {
  const kg = num(w.values["weightKg"]);
  if (w.kind.key !== "weigh_in" || !done(w) || kg === null || !ctx.weighings) return;
  const at = w.minute;
  const before = (i: DayItem) => at !== null && i.minute !== null && i.minute < at;
  const series = ctx.weighings;
  const flags = implausibleWeighIns(series);
  const mine = series.findIndex((p) => p.day === ctx.date && p.kg === kg);
  const night = nightOf(items);
  const { reliability } = readWeighIn({
    said: {
      fasted: yes(w.values["fasted"]),
      afterToilet: yes(w.values["afterToilet"]),
      afterTraining: yes(w.values["afterTraining"]),
    },
    hour: at !== null && at >= 0 && at < 1440 ? Math.floor(at / 60) : null,
    ateBeforeKcal: items
      .filter((i) => i.kind.key === "meal" && done(i) && before(i))
      .reduce((a, i) => a + Number(lineTotals(i.lines, servingsOf(i))["kcal"] ?? 0), 0),
    trainedBefore: items.some((i) => i.kind.key === "session" && done(i) && before(i)),
    yesterday: null,
    usual: null,
    sleptHours: night
      ? (night.end!.getTime() - night.start!.getTime()) / 3_600_000
      : null,
    implausible: mine >= 0 && flags[mine] === true,
  });
  const progress = ctx.weightGoal
    ? weightProgress(series, ctx.weightGoal, ctx.date)
    : null;
  const pace: Pace | null = progress
    ? {
        nowKg: progress.now,
        actual: progress.pace,
        needed: progress.needed,
        target: progress.target,
      }
    : null;
  const p = weighingParts({ reliability, pace, series, today: ctx.date });
  return boxScore(
    WEIGHING,
    { reliable: p.reliable, pace: p.pace, consistency: p.consistency },
    WEIGH_WORDS,
  );
}

export function sleepScore(
  s: DayItem,
  items: readonly DayItem[],
  ctx: ScoreContext,
): BoxEntry["score"] | undefined {
  if (s.kind.key !== "sleep" || !done(s) || !s.start || !s.end || !ctx.nights) return;
  const minute = (at: Date, day: IsoDate) => dayMinute(at, day, ctx.clock);
  const checkin = items.find(
    (i) => i.kind.key === "checkin" && done(i) && i.values["moment"] !== "evening",
  );
  const p = sleepParts({
    night: { bed: minute(s.start, ctx.date), wake: minute(s.end, ctx.date) },
    before: ctx.nights
      .filter((n) => n.day < ctx.date)
      .map((n) => ({ bed: minute(n.start, n.day), wake: minute(n.end, n.day) })),
    quality: num(s.values["quality"]),
    energy: checkin ? num(checkin.values["energy"]) : null,
  });
  return boxScore(
    SLEEP,
    { duration: p.duration, regularity: p.regularity, feel: p.feel },
    SLEEP_WORDS,
  );
}

const WAKE = 7 * 60;
const BED = 23 * 60 + 30;
/** A session's intensity when it says none: the developer's gym hours. */
const USUAL_INTENSITY: Session["intensity"] = "moderate";

/** The day's water as the boards' box: drunk of the need, the score, the reason for more. */
export function waterBox(items: readonly DayItem[], ctx: ScoreContext): BoxEntry {
  const drinks = items
    .filter((i) => i.kind.key === "water" && done(i) && i.minute !== null)
    .map((i) => ({ minute: i.minute!, litres: (num(i.values["ml"]) ?? 0) / 1000 }));
  const drunk = items
    .filter((i) => i.kind.key === "water" && done(i))
    .reduce((l, i) => l + (num(i.values["ml"]) ?? 0) / 1000, 0);
  const sessions = items
    .filter((i) => i.kind.key === "session" && done(i))
    .map((i) => {
      const span =
        i.start && i.end ? (i.end.getTime() - i.start.getTime()) / 60_000 : null;
      const minutes = num(i.values["durationMin"]) ?? span ?? 0;
      const intensity = i.values["intensity"];
      return {
        item: i,
        s: {
          minutes,
          intensity:
            intensity === "low" || intensity === "high" ? intensity : USUAL_INTENSITY,
          apparentC: null,
        } as Session,
      };
    })
    .filter((x) => x.s.minutes > 0);
  const base: BoxEntry = {
    fam: "drink",
    sub: "water",
    of: { kind: "water" },
    title: "Acqua",
    value: F.num(drunk, "l"),
  };
  if (ctx.sex === null) return base;
  const need = dailyNeed({
    sex: ctx.sex,
    sessions: sessions.map((x) => x.s),
    maxApparentC: null,
  });
  const wakeAt = items.find(
    (i) => i.kind.key === "sleep" && i.end && (i.minute ?? 0) < 18 * 60,
  );
  const bedAt = items.find(
    (i) => i.kind.key === "sleep" && i.start && (i.minute ?? 0) >= 18 * 60,
  );
  const wake = wakeAt?.end ? dayMinute(wakeAt.end, ctx.date, ctx.clock) : WAKE;
  const bed = bedAt?.start ? dayMinute(bedAt.start, ctx.date, ctx.clock) : BED;
  const last = sessions.filter((x) => x.item.end).at(-1);
  const parts = waterParts({
    drinks,
    needL: need.drinks,
    wake,
    bed,
    now: ctx.now ?? bed,
    session: last
      ? {
          endMinute: dayMinute(last.item.end!, ctx.date, ctx.clock),
          sweatL: sweatL(last.s),
        }
      : undefined,
  });
  const trained = need.reasons.filter((r) => r.type === "training");
  const extra = trained.reduce((l, r) => l + r.litres, 0);
  const minutes = trained.reduce(
    (m, r) => m + (r.type === "training" ? r.minutes : 0),
    0,
  );
  const s = boxScore(WATER, parts, WATER_WORDS);
  return {
    ...base,
    value: F.of(drunk, need.drinks, "l"),
    strip: [
      {
        w: Math.min(100, Math.round((drunk / Math.max(need.drinks, 0.1)) * 100)),
        c: "var(--macro-fat)",
      },
    ],
    ...(extra > 0
      ? {
          pills: [
            {
              t: F.signed(extra, "l") + " per " + F.hm(minutes) + " di allenamento",
              of: { fam: "train" },
            },
          ],
        }
      : {}),
    ...(s ? { score: s } : {}),
  };
}
