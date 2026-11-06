/**
 * E6 Training — the next session as a whole (engines.md E6): each exercise's
 * double progression, then
 *   volume     weekly sets per muscle (direct 1, indirect ½; concepts §6), in
 *              a band of 10–20: below it a set is added where the session
 *              trains the muscle directly; above it no more sets, since each
 *              further set adds less (Pelland 2024: diminishing returns)
 *   order      the effect of an exercise's place in the session, learnt from
 *              history: shown with the expectation, never folded into it
 *   readiness  a short night, low energy or high stress lowers the whole
 *              session: keep the load, one set fewer (v1 ADR-0049)
 */
import type { ReadinessReason } from "./rests";
import type { Guide, LastSet, Target } from "./progression";
import { nextTarget } from "./progression";
import { median } from "./stats";

export const VOLUME_BAND = { low: 10, high: 20 } as const;
const INDIRECT = 0.5;

export type ExerciseMuscles = { direct: readonly string[]; indirect: readonly string[] };

/** Weekly sets per muscle: each working set counts 1 for its direct muscles, ½ for the indirect ones. */
export function weeklySets(
  sets: readonly { exercise: string; warmup?: boolean | undefined }[],
  muscles: ReadonlyMap<string, ExerciseMuscles>,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of sets) {
    if (s.warmup) continue;
    const m = muscles.get(s.exercise);
    if (!m) continue;
    for (const d of m.direct) out.set(d, (out.get(d) ?? 0) + 1);
    for (const i of m.indirect) out.set(i, (out.get(i) ?? 0) + INDIRECT);
  }
  return out;
}

/**
 * What to add (session.md §5.4): the muscles the person trains (the primary
 * group of an exercise they used) whose weekly sets are under the band,
 * most missing first, each with one of their own exercises for it — never a
 * catalog they do not use. At most `max`.
 */
export function missingVolume(
  week: ReadonlyMap<string, number>,
  used: readonly { id: string; name: string; muscles: readonly string[] }[],
  max = 2,
): { muscle: string; sets: number; exercise: { id: string; name: string } }[] {
  const byMuscle = new Map<string, { id: string; name: string }>();
  for (const e of used) {
    const m = e.muscles[0];
    if (m && !byMuscle.has(m)) byMuscle.set(m, { id: e.id, name: e.name });
  }
  return [...byMuscle]
    .map(([muscle, exercise]) => ({ muscle, sets: week.get(muscle) ?? 0, exercise }))
    .filter((x) => x.sets < VOLUME_BAND.low)
    .sort((a, b) => a.sets - b.sets || a.muscle.localeCompare(b.muscle))
    .slice(0, max);
}

export type VolumeState = "under" | "in" | "over";
export function volumeState(sets: number): VolumeState {
  return sets < VOLUME_BAND.low ? "under" : sets > VOLUME_BAND.high ? "over" : "in";
}

/**
 * The effect of position, learnt: for each exercise its e1RM ÷ its own median, grouped by the
 * place it had in the session (0 = first), as a factor on the first place. A place with fewer
 * than three sessions says nothing (1).
 */
export function orderEffect(
  history: readonly { exercise: string; position: number; e1rm: number }[],
): Map<number, number> {
  const byEx = new Map<string, number[]>();
  for (const h of history)
    byEx.set(h.exercise, [...(byEx.get(h.exercise) ?? []), h.e1rm]);
  const medians = new Map([...byEx].map(([ex, xs]) => [ex, median(xs)]));
  const byPos = new Map<number, number[]>();
  for (const h of history)
    byPos.set(h.position, [
      ...(byPos.get(h.position) ?? []),
      h.e1rm / medians.get(h.exercise)!,
    ]);
  const at = (p: number) => {
    const xs = byPos.get(p) ?? [];
    return xs.length >= 3 ? median(xs) : null;
  };
  const first = at(0);
  const out = new Map<number, number>();
  for (const p of [...byPos.keys()].sort((a, b) => a - b)) {
    const f = at(p);
    out.set(p, f !== null && first !== null ? Math.round((f / first) * 1000) / 1000 : 1);
  }
  return out;
}

export type PlannedExercise = {
  exercise: string;
  guide: Guide;
  muscles: ExerciseMuscles;
  last?: readonly LastSet[] | undefined;
  before?: readonly LastSet[] | undefined;
};

export type SessionTarget = {
  exercise: string;
  target: Target;
  /** Why the session changed this exercise's target, if it did. */
  adjusted: ("readiness" | "volume_add")[];
  /** The learnt effect of its place, when it is not 1. */
  orderFactor: number | null;
};

export function nextSession(p: {
  exercises: readonly PlannedExercise[];
  /** Weekly sets per muscle so far this week, before this session. */
  weekSoFar: ReadonlyMap<string, number>;
  readiness: readonly ReadinessReason[];
  order?: ReadonlyMap<number, number> | undefined;
}): SessionTarget[] {
  const out: SessionTarget[] = p.exercises.map((e, i) => {
    const f = p.order?.get(i);
    return {
      exercise: e.exercise,
      target: nextTarget(e.guide, e.last, e.before),
      adjusted: [],
      orderFactor: f !== undefined && f !== 1 ? f : null,
    };
  });
  // Volume: what this session adds to each muscle, then one set more where a muscle stays under the band.
  const after = new Map(p.weekSoFar);
  for (const [i, e] of p.exercises.entries()) {
    const n = setsOf(out[i]!.target);
    for (const d of e.muscles.direct) after.set(d, (after.get(d) ?? 0) + n);
    for (const m of e.muscles.indirect) after.set(m, (after.get(m) ?? 0) + n * INDIRECT);
  }
  if (p.readiness.length === 0) {
    const added = new Set<string>();
    for (const [i, e] of p.exercises.entries()) {
      const t = out[i]!.target;
      const muscle = e.muscles.direct.find(
        (m) => volumeState(after.get(m) ?? 0) === "under" && !added.has(m),
      );
      if (!muscle || t.sets >= e.guide.sets[1] || "minutes" in t) continue;
      out[i] = {
        ...out[i]!,
        target: { ...t, sets: t.sets + 1 },
        adjusted: ["volume_add"],
      };
      added.add(muscle);
    }
    return out;
  }
  // A poor day: keep the load, one set fewer, on every exercise.
  return out.map((s, i) => {
    const e = p.exercises[i]!;
    const t = s.target;
    const sets = Math.max(1, t.sets - 1);
    if (t.reason === "add_load" && t.loadKg !== null) {
      const work = (e.last ?? []).filter((x) => !x.warmup && x.loadKg !== null);
      const top = work.length
        ? String(Math.max(...work.map((x) => Number(x.loadKg))))
        : t.loadKg;
      return {
        ...s,
        target: { ...t, reason: "hold", sets, loadKg: top },
        adjusted: ["readiness"],
      };
    }
    return { ...s, target: { ...t, sets }, adjusted: ["readiness"] };
  });
}

const setsOf = (t: Target) => t.sets;
