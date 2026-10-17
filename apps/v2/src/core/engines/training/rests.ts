/**
 * E6 Training — rests, gym mode's timing, readiness and deloads (engines.md E6).
 * Rests (all editable per exercise):
 *   heavy compounds (≤ 6 reps or ≥ 85 % of 1RM)  2–3 min
 *   other compounds                               90–120 s
 *   isolation and core                            60–90 s
 *   between sides                                 0–15 s
 *   after a warm-up, by the ramp                  30 / 45 / 60–90 s (practice)
 * Sources: Schoenfeld 2016; Singer 2024.
 */
import type { IsoDate } from "../time/date";
import { daysBetween } from "../time/date";
import { median, slope } from "./stats";

export type Role = "compound" | "isolation" | "core" | "cardio";
export type RestS = { low: number; high: number };

export function restAfter(p: {
  role: Role;
  reps: number;
  /** Load ÷ e1RM, when known. */
  intensity?: number | null | undefined;
  /** A warm-up set: its place in the ramp (0 first) and the ramp's length. */
  warmup?: { index: number; of: number } | undefined;
  /** The next set is the other side of a unilateral exercise. */
  otherSide?: boolean | undefined;
}): RestS {
  if (p.otherSide) return { low: 0, high: 15 };
  if (p.warmup) {
    const last = p.warmup.index >= p.warmup.of - 1;
    if (last) return { low: 60, high: 90 };
    return p.warmup.index === 0 ? { low: 30, high: 30 } : { low: 45, high: 45 };
  }
  if (p.role === "compound") {
    const heavy = p.reps <= 6 || (p.intensity ?? 0) >= 0.85;
    return heavy ? { low: 120, high: 180 } : { low: 90, high: 120 };
  }
  if (p.role === "cardio") return { low: 0, high: 0 };
  return { low: 60, high: 90 };
}

/** Seconds per rep when this exercise has no timed history (tempo by role). */
const DEFAULT_S_PER_REP: Record<Role, number> = {
  compound: 3.5,
  isolation: 2.75,
  core: 2.75,
  cardio: 0,
};
const SETUP_S = 10;

/**
 * Gym mode's auto timing: a set's expected duration = reps × this exercise's learnt seconds per
 * rep (the median of its timed sets), plus the setup delay.
 */
export function expectedSetS(p: {
  reps: number;
  role: Role;
  timed: readonly { reps: number; seconds: number }[];
  setupS?: number | undefined;
}): { seconds: number; learnt: boolean } {
  const perRep = p.timed
    .filter((t) => t.reps > 0 && t.seconds > 0)
    .map((t) => t.seconds / t.reps);
  const spr = perRep.length ? median(perRep) : DEFAULT_S_PER_REP[p.role];
  return {
    seconds: Math.round(p.reps * spr + (p.setupS ?? SETUP_S)),
    learnt: perRep.length > 0,
  };
}

/**
 * How ready the body is today (v1 ADR-0049): a short night (< 6 h), the check-in's energy 1–2
 * or stress 4–5 of 5. Any of them: keep the load, one set fewer. A hint, never applied by itself.
 */
export type ReadinessReason = "short_night" | "low_energy" | "high_stress";
export function readiness(p: {
  sleptHours: number | null;
  energy: number | null;
  stress: number | null;
}): ReadinessReason[] {
  const out: ReadinessReason[] = [];
  if (p.sleptHours !== null && p.sleptHours < 6) out.push("short_night");
  if (p.energy !== null && p.energy <= 2) out.push("low_energy");
  if (p.stress !== null && p.stress >= 4) out.push("high_stress");
  return out;
}

export type DeloadReason =
  { type: "falling"; exercises: string[] } | { type: "volume"; weeks: number };

const FALLING_DAYS = 14;
const FALLING_MIN_EXERCISES = 3;
/** The usual length of a block of rising volume before a lighter week. */
export const RISING_WEEKS = 6;

/**
 * A deload is suggested (never applied) when the e1RM has been falling on several exercises for
 * two weeks or more with low recovery, or after `risingWeeks` of rising weekly volume.
 */
export function deloadSuggestion(p: {
  today: IsoDate;
  /** Best e1RM per session, by exercise. */
  e1rm: ReadonlyMap<string, readonly { day: IsoDate; kg: number }[]>;
  /** Days in the last two weeks with a readiness reason. */
  lowRecoveryDays: number;
  /** Working sets per ISO week, oldest first, the current week last. */
  weeklySets: readonly number[];
  risingWeeks?: number | undefined;
}): DeloadReason | null {
  const falling: string[] = [];
  for (const [ex, pts] of p.e1rm) {
    const recent = pts.filter((x) => daysBetween(x.day, p.today) <= FALLING_DAYS);
    if (
      recent.length < 3 ||
      daysBetween(recent[0]!.day, recent.at(-1)!.day) < FALLING_DAYS - 2
    )
      continue;
    const s = slope(
      recent.map((x) => ({ x: daysBetween(recent[0]!.day, x.day), y: x.kg })),
    );
    if (s !== null && s < 0) falling.push(ex);
  }
  // Low recovery: at least a third of the two weeks.
  if (falling.length >= FALLING_MIN_EXERCISES && p.lowRecoveryDays >= 5)
    return { type: "falling", exercises: falling.sort() };
  const n = p.risingWeeks ?? RISING_WEEKS;
  let rising = 0;
  for (
    let i = p.weeklySets.length - 1;
    i > 0 && p.weeklySets[i]! > p.weeklySets[i - 1]!;
    i--
  )
    rising++;
  return rising >= n ? { type: "volume", weeks: rising } : null;
}
