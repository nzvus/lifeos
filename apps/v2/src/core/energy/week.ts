/**
 * core/energy/week.ts — the week's energy, once a week (dossiers/targets.md
 * §5, §9 decided 2026-10-24): E4's filter over the 56 days before Monday,
 * fed by E4a's priors, gives the trend weight W and the expenditure E (the
 * mean of the last 7 days, so one session does not set the week); the goal
 * in force gives the deficit through its pace (E5) and the density of a
 * change (E4), never over 500 kcal in a recomposition (Murphy & Koehler
 * 2022: larger deficits stop lean gains). Pure: `read.ts` brings the rows.
 *   each day           priced by day.ts (hours on feet, steps, sessions)
 *   weigh-ins           their reliability from what was said (fasted, toilet,
 *                       training) and the hour; implausible ones at 0.02
 */
import {
  bodyDensity,
  bodyState,
  estimatedBodyFatPct,
  implausibleWeighIns,
  readWeighIn,
  type BodyDay,
  type WeighIn,
} from "../engines/body";
import { bmr, filterInputs, type Range } from "../engines/expenditure";
import { deficitKcal, planPace, type GoalKind } from "../engines/targets";
import { addDays, localParts, type DayClock, type IsoDate } from "../engines/time";
import { priceDay } from "./day";
import type { EnergyRows } from "./read";

export const WINDOW_DAYS = 56;
export const RECOMP_MAX_DEFICIT = 500;

export type WeekGoal = {
  kind: GoalKind;
  targetKg: number | null;
  targetDay: IsoDate | null;
};

/** The payload of an automatic `week_targets` decision. */
export type WeekEnergy = {
  source: "auto";
  /** The days the filter read: from, to (the day before Monday). */
  from: IsoDate;
  to: IsoDate;
  expenditureKcal: number;
  sigmaKcal: number;
  trendKg: number;
  bmr: number;
  /** From the goal's pace; null without a weight goal (the model's own then applies). */
  deficitKcal: number | null;
  ratePctWeek: number | null;
  /** Days with food logged, of the window. */
  loggedDays: number;
  /**
   * What the priors say a day costs, the mean of the window's last 7 days, kcal
   * (Andamento → Energia: the estimates next to what was learnt).
   */
  priors: { bmr: number; everyday: number; steps: number; training: number; tef: number };
};

const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function weekEnergy(
  rows: EnergyRows,
  p: {
    from: IsoDate;
    to: IsoDate;
    today: IsoDate;
    clock: DayClock;
    goal: WeekGoal | null;
  },
): WeekEnergy | null {
  const body = rows.profile;
  if (!body || rows.weighIns.length === 0) return null;
  const age = Number(p.today.slice(0, 4)) - body.birthYear;
  const weighIns = [...rows.weighIns].sort((a, b) => a.day.localeCompare(b.day));
  const kgOn = (day: IsoDate) =>
    [...weighIns].reverse().find((w) => w.day <= day)?.kg ?? weighIns[0]!.kg;
  const closed = new Set(rows.closed);
  const partial = new Set(rows.partial);

  const days: BodyDay[] = [];
  const parts: WeekEnergy["priors"][] = [];
  let tails: Range[] = [];
  for (let d = p.from; d <= p.to; d = addDays(d, 1)) {
    const kg = kgOn(d);
    const meals = rows.meals.filter((m) => m.day === d);
    const eaten = meals.length ? meals.reduce((a, m) => a + m.kcal, 0) : null;
    const { prior, sessions } = priceDay(rows, d, {
      body: { sex: body.sex, kg, heightCm: body.heightCm, age },
      yesterdayTails: tails,
      eatenKcal: eaten,
    });
    tails = sessions.map((s) => s.tail);
    const m = (r: Range | null) => (r ? (r.low + r.high) / 2 : 0);
    // The everyday part holds food's thermic effect: shown apart, so the parts add up.
    parts.push({
      bmr: prior.bmr,
      everyday: Math.max(0, m(prior.baseline) - prior.bmr - m(prior.tef)),
      steps: m(prior.steps),
      training: m(prior.training),
      tef: m(prior.tef),
    });
    days.push({
      day: d,
      eatenKcal: eaten,
      estimatedKcal: meals.filter((m) => m.estimated).reduce((a, m) => a + m.kcal, 0),
      closed: closed.has(d) ? "complete" : partial.has(d) ? "partial" : null,
      ...filterInputs(prior),
    });
  }

  const inWindow = weighIns.filter((w) => w.day >= p.from && w.day <= p.to);
  const flags = implausibleWeighIns(inWindow);
  const points: WeighIn[] = inWindow.map((w, i) => ({
    day: w.day,
    kg: w.kg,
    reliability: readWeighIn({
      said: {
        fasted: w.fasted,
        afterToilet: w.afterToilet,
        afterTraining: w.afterTraining,
      },
      hour: w.at ? Math.floor(localParts(w.at, p.clock.timeZone).minute / 60) : null,
      ateBeforeKcal: 0,
      trainedBefore: false,
      yesterday: null,
      usual: null,
      implausible: flags[i],
    }).reliability,
  }));
  if (points.length === 0) return null;
  const meanKg = mean(points.map((w) => w.kg));
  const bodyFatPct = estimatedBodyFatPct(meanKg, body.heightCm, age, body.sex);
  const state = bodyState(days, points, { bodyFatPct });
  const last = state.days.slice(-7);
  if (last.length === 0) return null;
  const W = state.days.at(-1)!.weight.value;
  const expenditure = mean(last.map((d) => d.expenditure.value));
  const sigma = mean(last.map((d) => d.expenditure.sigma));

  let deficit: number | null = null;
  let rate: number | null = null;
  if (p.goal) {
    const pace = planPace(p.goal, W, p.today);
    rate = pace.ratePctWeek;
    deficit = deficitKcal(rate, W, bodyDensity(W, bodyFatPct));
    if (p.goal.kind === "recomp") deficit = Math.min(deficit, RECOMP_MAX_DEFICIT);
  }
  return {
    source: "auto",
    from: p.from,
    to: p.to,
    expenditureKcal: Math.round(expenditure),
    sigmaKcal: Math.round(sigma),
    trendKg: Math.round(W * 100) / 100,
    bmr: Math.round(bmr({ sex: body.sex, kg: W, heightCm: body.heightCm, age })),
    deficitKcal: deficit,
    ratePctWeek: rate,
    loggedDays: days.filter((d) => d.eatenKcal !== null).length,
    priors: (() => {
      const week = parts.slice(-7);
      const avg = (k: keyof WeekEnergy["priors"]) =>
        Math.round(mean(week.map((x) => x[k])));
      return {
        bmr: avg("bmr"),
        everyday: avg("everyday"),
        steps: avg("steps"),
        training: avg("training"),
        tef: avg("tef"),
      };
    })(),
  };
}
