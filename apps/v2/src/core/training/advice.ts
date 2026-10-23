/**
 * core/training/advice.ts — what gym mode proposes for one exercise, from
 * its history (dossiers/training.md §5), pure:
 *   sets     E6's double progression on the first set; the next ones lose
 *            the reps this exercise usually loses per set at one load; as
 *            many sets as the more of the last two sessions (one cut short
 *            does not lower the next)
 *   rest     the person's median for it (within floors), adapted to the
 *            last sessions' rep drops and RIR; unilateral: after both sides,
 *            less the other side's time
 *   trend    the 6-week trend of its best e1RM (reps or seconds without a
 *            load), with the hard sets before it as the order
 *   timing   seconds per rep (its own, else the person's) and the set's
 *            expected length
 * A value set on the exercise (its rest, its setup) wins over what is learnt.
 */
import {
  adaptRest,
  exerciseTrend,
  expectedSetS,
  learntDrop,
  learntRest,
  median,
  unilateralRests,
  type LastSet,
  type RestSource,
  type Role,
  type Timing,
  type Trend,
  type TrendPoint,
} from "../engines/training";
import type { HistorySession, HistorySet } from "./history";
import { bestE1rm } from "./log";
import { guideOf, proposeSets, type ProposedSet } from "./plan";

export type ExerciseSettings = {
  restS?: number | undefined;
  setupS?: number | undefined;
};

export type ExerciseAdvice = {
  proposed: ProposedSet[];
  role: Role;
  restS: number;
  restSource: RestSource | "set";
  /** Seconds the last sessions moved the rest by (+30, −15, 0). */
  restChange: number;
  /** Unilateral: the rest after both sides. */
  afterPairS: number | null;
  trend: Trend;
  secPerRep: number;
  setupS: number;
  /** The first proposed set's expected seconds (auto mode's set timer); unilateral: both sides. */
  setS: number | null;
  /** Unilateral: one side's seconds and the change between sides. */
  sideS: number | null;
  betweenS: number | null;
};

const DROP_SESSIONS = 6;
const SETUP_DEFAULT_S = 5;

const asLast = (s: HistorySet): LastSet => ({
  reps: s.reps,
  loadKg: s.loadKg,
  durationS: s.durationS,
  warmup: s.warmup,
  rir: s.rir,
});
const kgOf = (s: HistorySet) => (s.loadKg === null ? null : Number(s.loadKg));

/** Reps lost from the first to the last working set at the session's top load. */
function dropOf(sets: readonly HistorySet[]): number | null {
  const at = sets.filter((s) => !s.warmup && s.reps !== null && s.loadKg !== null);
  if (at.length < 2) return null;
  const top = Math.max(...at.map((s) => kgOf(s)!));
  const same = at.filter((s) => kgOf(s) === top);
  return same.length < 2 ? null : same[0]!.reps! - same.at(-1)!.reps!;
}

export function adviseExercise(p: {
  pattern: string | null;
  unilateral: boolean;
  /** Loads go by pairs of dumbbells. */
  dumbbells?: boolean | undefined;
  history: readonly HistorySession[];
  timing: Timing;
  settings?: ExerciseSettings | undefined;
}): ExerciseAdvice {
  const h = p.history;
  const last = h.at(-1)?.sets.map(asLast);
  const before = h.at(-2)?.sets.map(asLast);
  const proposal = proposeSets(p.pattern, last, before, p.dumbbells === true).sets;
  // A session cut short does not lower the next one: as many sets as the more of the last two.
  const most = Math.max(
    0,
    ...h.slice(-2).map((x) => x.sets.filter((y) => !y.warmup).length),
  );
  const base =
    proposal.length > 0 && proposal.length < most
      ? [
          ...proposal,
          ...Array.from({ length: most - proposal.length }, () => proposal.at(-1)!),
        ]
      : proposal;
  const recent = h.slice(-DROP_SESSIONS);
  const drop = learntDrop(
    recent.map((s) =>
      s.sets.filter((x) => !x.warmup).map((x) => ({ reps: x.reps, kg: kgOf(x) })),
    ),
  );
  const proposed = base.map((s, i) =>
    s.reps === null ? s : { ...s, reps: Math.max(1, s.reps - Math.round(drop * i)) },
  );
  const role: Role = guideOf(p.pattern)?.role ?? "compound";

  // This exercise's measured rests: between working sets, not from one side to the other.
  const measured: number[] = [];
  const perRep: number[] = [];
  for (const s of h) {
    const work = s.sets.filter((x) => !x.warmup);
    for (let i = 1; i < work.length; i++) {
      const a = work[i - 1]!;
      const b = work[i]!;
      if (a.side && b.side && a.side !== b.side) continue;
      if (a.endedAt !== null && b.startedAt !== null)
        measured.push((b.startedAt - a.endedAt) / 1000);
    }
    for (const x of s.sets)
      if (x.reps && x.startedAt !== null && x.endedAt !== null) {
        const sec = (x.endedAt - x.startedAt) / 1000;
        if (sec > 0 && sec < 600) perRep.push(sec / x.reps);
      }
  }
  const reps0 = proposed[0]?.reps ?? 10;
  const learnt = learntRest({ role, reps: reps0, measured });
  const drops = [...h]
    .reverse()
    .map((s) => dropOf(s.sets))
    .filter((d): d is number => d !== null);
  const lastWork = h.at(-1)?.sets.filter((x) => !x.warmup) ?? [];
  const adapted = adaptRest({
    role,
    seconds: learnt.seconds,
    drops,
    lastRir: lastWork.at(-1)?.rir ?? null,
  });
  const restS = p.settings?.restS ?? adapted.seconds;
  const secPerRep = perRep.length >= 5 ? median(perRep) : p.timing.secPerRep;
  const setupS = p.settings?.setupS ?? SETUP_DEFAULT_S;
  const oneSide =
    proposed[0]?.durationS ??
    (proposed[0]?.reps
      ? expectedSetS({
          reps: proposed[0].reps,
          role,
          timed: [{ reps: 1, seconds: secPerRep }],
          setupS: 0,
        }).seconds
      : null);

  const points: TrendPoint[] = h.flatMap((s) => {
    const work = s.sets.filter((x) => !x.warmup);
    const best =
      bestE1rm(work) ??
      (work.some((x) => x.reps !== null)
        ? Math.max(...work.map((x) => x.reps ?? 0))
        : Math.max(0, ...work.map((x) => x.durationS ?? 0)));
    return best > 0 ? [{ day: s.day, value: best, before: s.before }] : [];
  });

  const pair =
    p.unilateral && oneSide !== null
      ? unilateralRests({ setRestS: restS, otherSideS: oneSide, setupS })
      : null;
  const setS = oneSide !== null && pair ? oneSide * 2 + pair.betweenSidesS : oneSide;

  return {
    proposed,
    role,
    restS,
    restSource: p.settings?.restS !== undefined ? "set" : learnt.source,
    restChange: p.settings?.restS !== undefined ? 0 : adapted.change,
    afterPairS: pair?.afterPairS ?? null,
    sideS: pair ? oneSide : null,
    betweenS: pair?.betweenSidesS ?? null,
    trend: exerciseTrend(points),
    secPerRep,
    setupS,
    setS,
  };
}
