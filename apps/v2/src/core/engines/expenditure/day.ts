/**
 * E4a The expenditure prior of a day, part by part, as Andamento → Energia
 * shows it next to the learnt expenditure: base (BMR), everyday, steps,
 * training (sessions done, plus yesterday's tail), and food's thermic
 * effect as a part of the everyday ("of which"). Its midpoints are E4's
 * inputs B, T and S.
 */
import type { Range, Sex, Steps } from "./everyday";
import { add, bmr, everydayFactor, mid, scale, stepsKcal, TEF_SHARE } from "./everyday";

export type DayPrior = {
  bmr: number;
  /** BMR × the everyday factor: E4's B. */
  baseline: Range;
  /** Food's thermic effect, already inside the baseline; null without intake. */
  tef: Range | null;
  /** E4's S; null when the day has no steps known. */
  steps: Range | null;
  /** Sessions done (their prior) and the tails of yesterday's: E4's T. */
  training: Range;
  total: Range;
};

export function dayPrior(p: {
  body: {
    sex: Sex;
    kg: number;
    heightCm: number;
    age: number;
    bodyFatPct?: number | null;
  };
  hoursOnFeet: number;
  steps: Steps | null;
  sessions: readonly { prior: Range }[];
  /** The tails of the sessions done the day before. */
  yesterdayTails: readonly Range[];
  intakeKcal?: number | null;
}): DayPrior {
  const b = bmr(p.body);
  const baseline = scale(everydayFactor(p.hoursOnFeet), b);
  const steps = p.steps ? stepsKcal(p.steps, p.body.kg) : null;
  const training = add(
    { low: 0, high: 0 },
    ...p.sessions.map((s) => s.prior),
    ...p.yesterdayTails,
  );
  return {
    bmr: b,
    baseline,
    tef: p.intakeKcal != null ? scale(TEF_SHARE, p.intakeKcal) : null,
    steps,
    training,
    total: add(baseline, steps ?? { low: 0, high: 0 }, training),
  };
}

/** The midpoints E4's filter takes. */
export function filterInputs(d: DayPrior): {
  baseline: number;
  training: number;
  steps: number;
} {
  return {
    baseline: mid(d.baseline),
    training: mid(d.training),
    steps: d.steps ? mid(d.steps) : 0,
  };
}
