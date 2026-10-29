/**
 * core/energy/day.ts — one day priced piece by piece (dossiers/energy-day.md
 * §5): E4a's day prior plus what each session cost, so Oggi can show a
 * session's burn on its row and the day's on its box. `weekEnergy` runs the
 * same pricing over its 56 days. Pure: `read.ts` brings the rows.
 *   time on one's feet  hours (feet.ts): the day's own, an old level read as
 *                       2 · 5 · 8 h, else the median of the 14 days before
 *   steps               a day's count, 30 % of it in walks (no minute counts yet)
 *   sessions            lifted sets by their exercise's class (`sessionCost`),
 *                       cardio by its MET band over the session's minutes
 */
import {
  acsmMet,
  RUN_FROM_M_PER_MIN,
  activityCost,
  bmr,
  CARDIO_MET,
  CARDIO_MODERATE,
  classOf,
  dayPrior,
  sessionCost,
  type DayPrior,
  type Range,
  type Sex,
} from "../engines/expenditure";
import type { IsoDate } from "../engines/time";
import { hoursOnFeetOn, type Feet } from "./feet";
import type { EnergyRows } from "./read";

const WALK_SHARE = 0.3;
/** A trained person repeating sessions: half the next-day tail of new work. */
const NOVELTY = 0.5;
/** Seconds per rep when a set was not timed, for the rest left in a session's minutes. */
const SECONDS_PER_REP = 4;
const ZERO: Range = { low: 0, high: 0 };

export type PricedSession = {
  id: string;
  /** What the session burned above rest, during it and the hours after (its row shows this). */
  burn: Range;
  /** The same × 0.75, what the day counts: the person compensates the rest (Careau 2021). */
  prior: Range;
  /** Its share the next day (after-burn of new work). */
  tail: Range;
};

export type PricedDay = {
  day: IsoDate;
  prior: DayPrior;
  feet: Feet;
  sessions: PricedSession[];
};

export type DayBody = { sex: Sex; kg: number; heightCm: number; age: number };

/** One session's cost: lifted sets set by set, cardio by its band over its minutes. */
export function priceSession(
  s: EnergyRows["sessions"][number],
  body: { kg: number; bmr: number },
): PricedSession {
  const { kg } = body;
  // An activity is cardio by its catalog kind, not only by a known pattern.
  const lifted = s.exercises.filter((e) => !e.cardio && classOf(e.pattern) !== null);
  const cardio = s.exercises.filter((e) => e.cardio || classOf(e.pattern) === null);
  const share = s.minutes && s.exercises.length ? s.minutes / s.exercises.length : 0;
  const sets = lifted.flatMap((e) =>
    e.sets.map((x) => ({
      exercise: e.pattern ?? "",
      cls: classOf(e.pattern)!,
      reps: x.reps,
      kg: x.kg > 0 ? x.kg : kg,
      rir: x.rir ?? undefined,
      start: x.start ?? undefined,
      end: x.end ?? undefined,
    })),
  );
  const work = sets.reduce((a, x) => a + (x.reps * SECONDS_PER_REP) / 60, 0);
  const liftedMin = share * lifted.length;
  const cost = sets.length
    ? sessionCost({
        sets,
        bodyKg: kg,
        bmr: body.bmr,
        restMin: Math.max(0, liftedMin - work),
        novelty: NOVELTY,
      })
    : null;
  // Walking and running with a distance and a time by ACSM; else the mode's MET band.
  const cardioCost = cardio.map((e) => {
    const minutes = e.cardioMin ?? share;
    const met =
      acsmMet(e.cardioM, minutes, e.inclinePct) ??
      ((e.pattern && CARDIO_MET[e.pattern]) || CARDIO_MODERATE);
    return activityCost(met, kg, minutes);
  });
  const sum = (rs: (Range | undefined)[]) =>
    rs.reduce<Range>(
      (a, r) => (r ? { low: a.low + r.low, high: a.high + r.high } : a),
      ZERO,
    );
  return {
    id: s.id,
    burn: sum([cost?.session, ...cardioCost.map((c) => c.session)]),
    prior: sum([cost?.prior, ...cardioCost.map((c) => c.prior)]),
    tail: cost?.tail ?? ZERO,
  };
}

/** The day's prior and its sessions, given yesterday's session tails and what was eaten. */
/** Patterns on foot: their steps are in the phone's total too. */
const ON_FOOT = new Set(["run", "treadmill", "walk"]);
/** Running cadence, steps/min (Tudor-Locke 2018: ≈ 160–180), and the walking stride, × height. */
const RUN_CADENCE = 165;
const STRIDE_OF_HEIGHT = 0.415;

/**
 * The steps of the day's runs and walks with a distance (activity.md §5): priced by ACSM,
 * so taken out of the phone's total before the steps are priced by cadence.
 */
export function activitySteps(
  sessions: EnergyRows["sessions"],
  heightCm: number,
): number {
  let n = 0;
  for (const s of sessions)
    for (const e of s.exercises) {
      if (!e.cardioM || !e.cardioMin || !(e.pattern && ON_FOOT.has(e.pattern))) continue;
      const running = e.cardioM / e.cardioMin >= RUN_FROM_M_PER_MIN;
      n += running
        ? RUN_CADENCE * e.cardioMin
        : e.cardioM / (STRIDE_OF_HEIGHT * (heightCm / 100));
    }
  return Math.round(n);
}

export function priceDay(
  rows: Pick<EnergyRows, "steps" | "sessions">,
  day: IsoDate,
  p: { body: DayBody; yesterdayTails: readonly Range[]; eatenKcal: number | null },
): PricedDay {
  const b = bmr(p.body);
  const step = rows.steps.find((s) => s.day === day);
  const today = rows.sessions.filter((s) => s.day === day);
  const sessions = today.map((s) => priceSession(s, { kg: p.body.kg, bmr: b }));
  const counted = activitySteps(today, p.body.heightCm);
  const feet = hoursOnFeetOn(day, rows.steps);
  const prior = dayPrior({
    body: p.body,
    hoursOnFeet: feet.hours,
    steps:
      step?.steps != null
        ? {
            type: "total",
            steps: Math.max(0, step.steps - counted),
            walkShare: WALK_SHARE,
          }
        : null,
    sessions,
    yesterdayTails: p.yesterdayTails,
    intakeKcal: p.eatenKcal,
  });
  return { day, prior, feet, sessions };
}

/** A planned gym session's sets are not known yet: the Compendium's band, 02054 to 02052. */
export const PLANNED_SESSION_MET: Range = { low: 3.5, high: 5 };
const PLANNED_DEFAULT_MIN = 60;

/**
 * A planned session's cost before it is done (energy-day.md §6): the person's median
 * session length over the rows read (else 60 min) in the Compendium's band.
 */
export function plannedSessionCost(
  done: EnergyRows["sessions"],
  kg: number,
): { minutes: number; burn: Range; prior: Range } {
  const mins = done
    .map((s) => s.minutes)
    .filter((m): m is number => m !== null && m >= 10)
    .sort((a, b) => a - b);
  const k = mins.length >> 1;
  const minutes = mins.length
    ? mins.length % 2
      ? mins[k]!
      : (mins[k - 1]! + mins[k]!) / 2
    : PLANNED_DEFAULT_MIN;
  const c = activityCost(PLANNED_SESSION_MET, kg, minutes);
  return { minutes, burn: c.session, prior: c.prior };
}
