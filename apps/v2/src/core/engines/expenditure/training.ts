/**
 * E4a The expenditure prior — training, set by set (engines.md E4a). Not one
 * MET for the whole session, as v1 did: that counts the rests as work.
 *   work     each set's time (measured from its start and end, else reps ×
 *            tempo), at its exercise class's MET scaled by the set's
 *            relative intensity
 *   rests    measured between sets, setup between exercises included, at 1.5–2 MET
 *   EPOC     the first hours after: + 5–15 % of the session's net cost,
 *            higher with short rests and many hard sets
 *   tail     the next day: resting metabolism + 3–5 % after hard or new work,
 *            smaller for a trained person and a repeated session
 *   floor    the 2024 Compendium's whole-session value, 3.5 MET (02054: resistance
 *            training, multiple exercises, 8–15 reps) over the session's minutes,
 *            net: the set-by-set sum may not fall below it (energy-day.md §3: it
 *            priced the rests too low, ≈ 2/3 of the Compendium)
 *   prior    × 0.75: what the person compensates after training (Careau 2021);
 *            E4's cT learns the rest for this person
 * Everything is net of one MET (resting is in the baseline).
 * Sources: Ainsworth 2011 and Herrmann 2024 (Compendium); Reis 2017 and Vezina 2014
 * (resistance-exercise energy cost); Careau 2021.
 * Tonnage is a check, not the driver: mechanical work at 20–25 % efficiency
 * gives a floor for the working sets.
 */
import type { Range } from "./everyday";
import { add, mid, netKcal, range, scale } from "./everyday";

export type ExerciseClass = "lowerCompound" | "upperCompound" | "isolation" | "core";

/** MET on work time at the reference intensity (≈ 75 % of 1RM, about a 10RM). */
export const CLASS_MET: Record<ExerciseClass, Range> = {
  lowerCompound: { low: 6, high: 6 },
  upperCompound: { low: 5, high: 5 },
  isolation: { low: 3.5, high: 4 },
  core: { low: 3.8, high: 3.8 },
};
/** Seconds per rep when a set was not timed. */
const TEMPO_S: Record<ExerciseClass, Range> = {
  lowerCompound: { low: 3, high: 4 },
  upperCompound: { low: 3, high: 4 },
  isolation: { low: 2.5, high: 3 },
  core: { low: 2.5, high: 3 },
};
export const REST_MET: Range = { low: 1.5, high: 2 };
/** 2024 Adult Compendium 02054, a whole session of resistance training: the floor. */
export const SESSION_FLOOR_MET: Range = { low: 3.5, high: 3.5 };
const REFERENCE_INTENSITY = 0.75;
/** The MET's scaling by intensity stays within these bounds. */
const INTENSITY_SCALE = { min: 0.6, max: 1.3 };
const EPOC = { min: 0.05, max: 0.15 };
const TAIL_OF_BMR = { low: 0.03, high: 0.05 };
export const COMPENSATION = 0.75;
const G = 9.81;
const EFFICIENCY: Range = { low: 0.2, high: 0.25 };
const J_PER_KCAL = 4184;

export type SetDone = {
  exercise: string;
  cls: ExerciseClass;
  reps: number;
  /** Load lifted, kg (bodyweight work passes the moved mass). */
  kg: number;
  /** Measured in gym mode, epoch ms; absent when not timed. */
  start?: number | undefined;
  end?: number | undefined;
  e1rm?: number | undefined;
  rir?: number | undefined;
  /** Range of motion, m, for the mechanical floor. */
  romM?: number | undefined;
};

export type SessionCost = {
  workMin: number;
  restMin: number;
  work: Range;
  rest: Range;
  epoc: Range;
  /** The Compendium's whole-session floor (net), before EPOC. */
  compendium: Range;
  /** Gross net cost: work + rest (at least the floor) + EPOC. */
  session: Range;
  /** The prior for E4: × 0.75 (Careau 2021). */
  prior: Range;
  /** Added to the next day's prior. */
  tail: Range;
  /** The floor from mechanical work on the working sets, kcal. */
  floor: Range;
};

/** load ÷ e1RM; without an e1RM, from reps + RIR by Epley (1RM = load × (1 + reps/30)). */
export function relativeIntensity(
  s: Pick<SetDone, "reps" | "kg" | "e1rm" | "rir">,
): number | null {
  if (s.e1rm && s.e1rm > 0) return Math.min(1, s.kg / s.e1rm);
  if (s.rir !== undefined) return 1 / (1 + (s.reps + s.rir) / 30);
  return null;
}

function intensityScale(s: SetDone): number {
  const i = relativeIntensity(s);
  if (i === null) return 1;
  return Math.min(
    INTENSITY_SCALE.max,
    Math.max(INTENSITY_SCALE.min, i / REFERENCE_INTENSITY),
  );
}

const workMinutes = (s: SetDone): Range =>
  s.start !== undefined && s.end !== undefined && s.end > s.start
    ? range((s.end - s.start) / 60_000, (s.end - s.start) / 60_000)
    : scale(TEMPO_S[s.cls], s.reps / 60);

/**
 * A session's cost from its sets, in order. Rests are the gaps between one set's end
 * and the next one's start; untimed sets need `restMin` given for the whole session.
 */
export function sessionCost(p: {
  sets: readonly SetDone[];
  bodyKg: number;
  bmr: number;
  /** Rest minutes when the sets were not timed. */
  restMin?: number | undefined;
  /** 1 for new or unusually hard work, lower for a trained person repeating a session (0…1). */
  novelty: number;
}): SessionCost {
  const { sets, bodyKg } = p;
  let work: Range = { low: 0, high: 0 };
  let workMin = 0;
  for (const s of sets) {
    const minutes = workMinutes(s);
    workMin += mid(minutes);
    const met = scale(CLASS_MET[s.cls], intensityScale(s));
    work = add(
      work,
      range(
        netKcal(met, bodyKg, minutes.low).low,
        netKcal(met, bodyKg, minutes.high).high,
      ),
    );
  }
  let gaps = 0;
  for (let i = 1; i < sets.length; i++) {
    const a = sets[i - 1]!.end;
    const b = sets[i]!.start;
    if (a !== undefined && b !== undefined && b > a) gaps += (b - a) / 60_000;
  }
  const restMin = gaps > 0 ? gaps : (p.restMin ?? 0);
  const rest = netKcal(REST_MET, bodyKg, restMin);
  const share = epocShare(sets, restMin);
  const compendium = netKcal(SESSION_FLOOR_MET, bodyKg, workMin + restMin);
  const sum = add(work, rest);
  const net = range(
    Math.max(sum.low, compendium.low),
    Math.max(sum.high, compendium.high),
  );
  const epoc = scale(net, share);
  const session = add(net, epoc);
  const novelty = Math.min(1, Math.max(0, p.novelty));
  const tail = scale(range(p.bmr * TAIL_OF_BMR.low, p.bmr * TAIL_OF_BMR.high), novelty);
  return {
    workMin,
    restMin,
    work,
    rest,
    compendium,
    epoc,
    session,
    prior: scale(session, COMPENSATION),
    tail,
    floor: mechanicalFloor(sets),
  };
}

/**
 * EPOC's share, 5–15 %: half from the rests (≤ 1 min each → 1, ≥ 3 min → 0), half from
 * the hard sets (RIR ≤ 2; 15 or more → 1). Sets with no RIR are not counted as hard.
 */
function epocShare(sets: readonly SetDone[], restMin: number): number {
  if (sets.length === 0) return 0;
  const perRest = sets.length > 1 ? restMin / (sets.length - 1) : 3;
  const shortRests = Math.min(1, Math.max(0, (3 - perRest) / 2));
  const hard = Math.min(
    1,
    sets.filter((s) => s.rir !== undefined && s.rir <= 2).length / 15,
  );
  return EPOC.min + ((EPOC.max - EPOC.min) * (shortRests + hard)) / 2;
}

/** Mechanical work of the working sets (load × reps × ROM × g) over 20–25 % efficiency, kcal. */
export function mechanicalFloor(sets: readonly SetDone[]): Range {
  const joules = sets.reduce((a, s) => a + s.kg * s.reps * (s.romM ?? 0) * G, 0);
  return range(
    joules / EFFICIENCY.high / J_PER_KCAL,
    joules / EFFICIENCY.low / J_PER_KCAL,
  );
}

/** Cardio or any timed activity: a MET band over its minutes, net of resting, × the compensation. */
export function activityCost(
  met: Range,
  bodyKg: number,
  minutes: number,
): { session: Range; prior: Range } {
  const session = netKcal(met, bodyKg, minutes);
  return { session, prior: scale(session, COMPENSATION) };
}
