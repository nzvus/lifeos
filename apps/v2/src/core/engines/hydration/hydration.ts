/**
 * E10 Hydration (engines.md E10). Advice with its reason, never a judgement.
 *   need      the EFSA adequate intake of total water (2.5 l a day for men,
 *             2.0 for women; ≈ 20 % from food), plus sweat by session
 *             (≈ 0.5–2 l/h by intensity and apparent temperature, ACSM 2007),
 *             plus a margin for heat above ≈ 25 °C
 *   intake    drinks plus food water from the catalogue; habitual caffeine
 *             counts as fluid (Maughan & Griffin 2003; Killer 2014)
 *   after training, weighed before and after: 1.25–1.5 × the mass lost (ACSM 2007)
 * The sweat rates by intensity and the heat margin are this engine's
 * assumptions within ACSM's range; they are constants below, to be tuned.
 * The water score's parts (E7 "water") are computed here as 0–1 values.
 */

export type Sex = "male" | "female";

/** EFSA 2010 adequate intake of total water, litres a day. */
export const EFSA_TOTAL_L: Record<Sex, number> = { male: 2.5, female: 2.0 };
/** The usual share of total water that comes from food, when the catalogue does not say. */
export const FOOD_SHARE = 0.2;
/** Sweat, litres per hour, at 20 °C apparent, by intensity. */
const SWEAT_L_H = { low: 0.5, moderate: 1.0, high: 1.5 } as const;
/** + litres per hour for each °C of apparent temperature above 20, within 0.5–2 l/h. */
const SWEAT_PER_DEGREE = 0.05;
const SWEAT_RANGE = { min: 0.5, max: 2 };
/** + litres a day for each °C of the day's highest apparent temperature above 25. */
const HEAT_PER_DEGREE = 0.05;
const HEAT_FROM = 25;
const REPLACE = { low: 1.25, high: 1.5 };

export type Session = {
  minutes: number;
  intensity: keyof typeof SWEAT_L_H;
  /** Apparent temperature during it, °C; indoors pass the room's (≈ 20). */
  apparentC: number | null;
};

export function sweatL(s: Session): number {
  const rate =
    SWEAT_L_H[s.intensity] + SWEAT_PER_DEGREE * Math.max(0, (s.apparentC ?? 20) - 20);
  return (Math.min(SWEAT_RANGE.max, Math.max(SWEAT_RANGE.min, rate)) * s.minutes) / 60;
}

export type Reason =
  | { type: "base"; litres: number }
  | { type: "training"; litres: number; minutes: number; apparentC: number | null }
  | { type: "heat"; litres: number; maxApparentC: number };

export type Need = {
  /** What to drink today, litres: total need minus food water. */
  drinks: number;
  total: number;
  foodWater: number;
  reasons: Reason[];
};

export function dailyNeed(p: {
  sex: Sex;
  sessions: readonly Session[];
  maxApparentC: number | null;
  /** Water from the day's food (catalogue), litres; null when unknown. */
  foodWaterL?: number | null | undefined;
}): Need {
  const base = EFSA_TOTAL_L[p.sex];
  const reasons: Reason[] = [{ type: "base", litres: base }];
  let total = base;
  for (const s of p.sessions) {
    const l = sweatL(s);
    total += l;
    reasons.push({
      type: "training",
      litres: round2(l),
      minutes: s.minutes,
      apparentC: s.apparentC,
    });
  }
  if (p.maxApparentC !== null && p.maxApparentC > HEAT_FROM) {
    const l = HEAT_PER_DEGREE * (p.maxApparentC - HEAT_FROM);
    total += l;
    reasons.push({ type: "heat", litres: round2(l), maxApparentC: p.maxApparentC });
  }
  const foodWater = p.foodWaterL ?? base * FOOD_SHARE;
  return {
    drinks: round2(Math.max(0, total - foodWater)),
    total: round2(total),
    foodWater: round2(foodWater),
    reasons,
  };
}

/** What to drink after a session weighed before and after, litres. */
export function afterTraining(
  kgBefore: number,
  kgAfter: number,
): { low: number; high: number } | null {
  const lost = kgBefore - kgAfter;
  if (!(lost > 0)) return null;
  return { low: round2(lost * REPLACE.low), high: round2(lost * REPLACE.high) };
}

export type Drink = { minute: number; litres: number };

/**
 * The water score's parts, 0–1:
 *   expected       drunk by now against the drinks need spread evenly over the waking hours
 *   afterTraining  drunk within 2 h after the session against 1.25 × its sweat (null without one)
 *   spread         doses of ≤ 0.5 l, and ≤ 0.3 l in the 2 h before bed
 */
export function waterParts(p: {
  drinks: readonly Drink[];
  needL: number;
  wake: number;
  bed: number;
  now: number;
  session?: { endMinute: number; sweatL: number } | undefined;
}): { expected: number | null; afterTraining: number | null; spread: number | null } {
  const awake = p.bed - p.wake;
  const sofar = p.drinks
    .filter((d) => d.minute <= p.now)
    .reduce((a, d) => a + d.litres, 0);
  const due =
    awake > 0 ? p.needL * Math.min(1, Math.max(0, (p.now - p.wake) / awake)) : 0;
  const expected = due > 0 ? Math.min(1, sofar / due) : null;
  let after: number | null = null;
  if (p.session && p.session.sweatL > 0) {
    const within = p.drinks
      .filter(
        (d) => d.minute >= p.session!.endMinute && d.minute <= p.session!.endMinute + 120,
      )
      .reduce((a, d) => a + d.litres, 0);
    after = Math.min(1, within / (REPLACE.low * p.session.sweatL));
  }
  let spread: number | null = null;
  if (p.drinks.length) {
    const small = p.drinks.filter((d) => d.litres <= 0.5).length / p.drinks.length;
    const late = p.drinks
      .filter((d) => d.minute >= p.bed - 120 && d.minute <= p.bed)
      .reduce((a, d) => a + d.litres, 0);
    spread = small * (late <= 0.3 ? 1 : Math.max(0, 1 - (late - 0.3) / 0.5));
  }
  return { expected, afterTraining: after, spread };
}

const round2 = (x: number) => Math.round(x * 100) / 100;
