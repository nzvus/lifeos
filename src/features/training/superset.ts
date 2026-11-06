/**
 * Supersets (session.md §5.2, §9.2: a «⋯» action, never automatic): two
 * exercises done in turn, A then B with only the change between them, then
 * the rest, then A again. Only for muscles that do not compete: never two
 * exercises sharing a muscle group; antagonist pairs (chest–back,
 * biceps–triceps, quads–hamstrings…) are the ones the evidence backs
 * (Zhang 2025: same work in less time). And what comes after a set: the
 * partner, or the next exercise as before. Pure.
 */
import { workDone } from "./gym-parts";
import type { GymExercise } from "./Gym";

/** The change from A to B: walk to the other station and set it. */
export const SUPERSET_SWITCH_S = 15;

const ANTAGONIST: Record<string, readonly string[]> = {
  chest: ["upper_back", "lats", "rear_delts"],
  upper_back: ["chest"],
  lats: ["chest", "front_delts", "side_delts"],
  front_delts: ["lats", "rear_delts"],
  side_delts: ["lats"],
  rear_delts: ["chest", "front_delts"],
  biceps: ["triceps"],
  triceps: ["biceps"],
  quads: ["hamstrings"],
  hamstrings: ["quads"],
  abs: ["lower_back"],
  lower_back: ["abs"],
};

/** Two exercises can go together: no muscle group in common. */
export const canPair = (a: { muscles: string[] }, b: { muscles: string[] }) =>
  a.muscles.length > 0 &&
  b.muscles.length > 0 &&
  !a.muscles.some((m) => b.muscles.includes(m));

/** Their main muscles pull against each other (the pairs worth proposing first). */
export const antagonists = (a: { muscles: string[] }, b: { muscles: string[] }) =>
  !!a.muscles[0] &&
  !!b.muscles[0] &&
  (ANTAGONIST[a.muscles[0]] ?? []).includes(b.muscles[0]);

const hasWork = (e: GymExercise) =>
  !e.skipped && workDone(e) < Math.max(1, e.proposed.length);

/**
 * After a set of `exercises[at]`: where to go and how long to rest. A warm-up
 * stays on the exercise; in a superset with work left on the partner, the
 * first of the pair goes to the partner after the change, the second rests
 * the longer of the two rests and goes back; otherwise as before (the next
 * exercise with work left, or none: -1).
 */
export function afterSet(
  exercises: readonly GymExercise[],
  at: number,
  warmup: boolean,
  times: { warmupRestS: number; transitionS: number },
): { next: number; seconds: number; words: string } {
  const x = exercises[at]!;
  if (warmup)
    return { next: at, seconds: times.warmupRestS, words: "dopo il riscaldamento" };
  const p = x.partner ? exercises.findIndex((e) => e.entryId === x.partner) : -1;
  if (p !== -1 && hasWork(exercises[p]!)) {
    const partner = exercises[p]!;
    return p > at
      ? {
          next: p,
          seconds: SUPERSET_SWITCH_S,
          words: "superserie · subito " + partner.name,
        }
      : {
          next: p,
          seconds: Math.max(x.restS, partner.restS),
          words: "superserie · poi " + partner.name,
        };
  }
  const finished = workDone(x) + 1 >= x.proposed.length;
  if (!finished) return { next: at, seconds: x.restS, words: x.restWords };
  const next = exercises.findIndex((e, i) => i > at && hasWork(e));
  return { next, seconds: times.transitionS, words: "cambio esercizio · tua media" };
}
