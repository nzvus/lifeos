/**
 * E6 Training — what to aim for next time on an exercise (engines.md E6; v1
 * ADR-0028/0049, its rules kept and its cases ported as parity).
 *
 * Double progression: keep the load and add reps until every working set
 * reaches the top of the range; then one load step up and back to the
 * bottom. Bodyweight moves by reps; planks and cardio by time (+10 %).
 * With no history: the range at "a load you could lift 2–3 more times".
 *
 * Gated by effort (reps in reserve): a working set at RIR 0 is "too hard",
 * except the last set of an isolation exercise. Too hard at the heaviest
 * load: same load (hold_effort); too hard the session before as well: one
 * step down (reduce). The top of the range adds load only when no set
 * there was too hard. Sets without RIR progress as before.
 *
 * Guides per movement pattern: ACSM 2009; Schoenfeld 2016–2021 on volume,
 * rep ranges and rest. Guidance, not prescription.
 */

export type Guide = {
  role: "compound" | "isolation" | "core" | "cardio";
  /** Working reps (seconds for a plank, minutes for cardio). */
  reps: [number, number];
  sets: [number, number];
  restS: [number, number];
  warmup: boolean;
  progression: "load" | "reps" | "time";
};

const compound = (reps: [number, number] = [6, 10]): Guide => ({
  role: "compound",
  reps,
  sets: [3, 4],
  restS: [120, 180],
  warmup: true,
  progression: "load",
});
const isolation = (reps: [number, number] = [10, 15]): Guide => ({
  role: "isolation",
  reps,
  sets: [2, 4],
  restS: [60, 90],
  warmup: false,
  progression: "load",
});
const timed = (
  role: "core" | "cardio",
  reps: [number, number],
  sets: [number, number],
  restS: [number, number],
): Guide => ({
  role,
  reps,
  sets,
  restS,
  warmup: false,
  progression: "time",
});

export const GUIDES = {
  horizontal_press: compound(),
  vertical_press: compound([6, 10]),
  horizontal_pull: compound([8, 12]),
  vertical_pull: compound([8, 12]),
  squat: compound([5, 8]),
  leg_press: compound([8, 12]),
  lunge: { ...compound([8, 12]), warmup: false },
  hinge: compound([5, 8]),
  fly: isolation([10, 15]),
  rear_fly: isolation([12, 20]),
  lateral_raise: isolation([12, 20]),
  curl: isolation([8, 12]),
  triceps_extension: isolation([10, 15]),
  leg_curl: isolation([8, 12]),
  leg_extension: isolation([10, 15]),
  calf_raise: isolation([10, 15]),
  crunch: { ...isolation([10, 20]), role: "core" },
  leg_raise: { ...isolation([8, 15]), role: "core", progression: "reps" },
  plank: timed("core", [30, 60], [2, 3], [45, 60]),
  run: timed("cardio", [20, 45], [1, 1], [0, 0]),
  bike: timed("cardio", [20, 45], [1, 1], [0, 0]),
} satisfies Record<string, Guide>;
export type GuideKey = keyof typeof GUIDES;

/** One tap of load: 2.5 kg from 20 kg up (plates), else 1 kg (dumbbells, cables). */
export function loadStep(kg: number): number {
  return kg >= 20 ? 2.5 : 1;
}

/**
 * A pair of dumbbells' step, on the stored total: the next dumbbell is 1 kg
 * heavier under 10 kg each, 2 kg from 10 kg up (a gym's usual rack), so the
 * total moves by twice that. 16.25 kg a dumbbell does not exist.
 */
export function dumbbellStep(totalKg: number): number {
  return (totalKg / 2 < 10 ? 1 : 2) * 2;
}

export type LastSet = {
  reps: number | null;
  /** Kg as exact text, null for bodyweight. */
  loadKg: string | null;
  durationS: number | null;
  warmup: boolean;
  rir?: number | null | undefined;
};

export type Target =
  | { reason: "start"; sets: number; reps: [number, number] }
  | {
      reason: "add_load" | "add_reps" | "hold" | "hold_effort" | "reduce";
      sets: number;
      reps: [number, number];
      loadKg: string | null;
    }
  | {
      reason: "add_time" | "hold_time";
      sets: number;
      minutes?: number;
      seconds?: number;
    };

function tooHard(guide: Guide, work: readonly LastSet[]): boolean {
  return work.some(
    (s, i) => s.rir === 0 && !(guide.role === "isolation" && i === work.length - 1),
  );
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export function nextTarget(
  guide: Guide,
  last: readonly LastSet[] | undefined,
  before?: readonly LastSet[],
  step: (kg: number) => number = loadStep,
): Target {
  const work = (last ?? []).filter((s) => !s.warmup);
  const [lo, hi] = guide.reps;
  const sets = work.length || guide.sets[0];
  if (guide.progression === "time") {
    if (guide.role === "cardio") {
      const min = Math.round(work.reduce((a, s) => a + (s.durationS ?? 0), 0) / 60);
      if (!min) return { reason: "hold_time", sets: 1, minutes: lo };
      return {
        reason: "add_time",
        sets: 1,
        minutes: Math.min(hi * 2, Math.round(min * 1.1)),
      };
    }
    const sec = Math.max(...work.map((s) => s.durationS ?? 0), 0);
    if (!sec) return { reason: "hold_time", sets, seconds: lo };
    return { reason: "add_time", sets, seconds: Math.round(sec * 1.1) };
  }
  if (work.length === 0) return { reason: "start", sets, reps: [lo, hi] };
  // TR-30 (fixed 17 Nov, target.md §7.5): the plan aims at the FIRST set; the next sets lose his
  // learnt drop later (TR-31), so the drop is never counted twice. The reference is his best
  // first set of the last two sessions at the same load: one bad day does not lower the plan.
  const at = (sets: readonly LastSet[]) => {
    const loaded = sets.filter((s) => s.loadKg !== null);
    const top = loaded.length ? Math.max(...loaded.map((s) => Number(s.loadKg))) : null;
    const same = top === null ? sets : loaded.filter((s) => Number(s.loadKg) === top);
    return { top, text: same[0]?.loadKg ?? null, reps: same.map((s) => s.reps ?? 0) };
  };
  const now = at(work);
  const prior = (before ?? []).filter((s) => !s.warmup);
  const was = prior.length ? at(prior) : null;
  const sameLoad = was !== null && was.top === now.top;
  const kg = now.top === null ? null : now.text;
  const reps = now.reps;
  const weakest = Math.min(...reps);
  const first = sameLoad ? Math.max(reps[0]!, was!.reps[0]!) : reps[0]!;
  // Up only when the first set reached the top and no set fell under the range, in BOTH of the
  // last two sessions at this load (one good day is not enough).
  const topped = (r: readonly number[]) => r[0]! >= hi && Math.min(...r) >= lo;
  const ready = topped(reps) && sameLoad && topped(was!.reps);
  const aim = (): [number, number] => [Math.min(hi, Math.max(lo, first + 1)), hi];
  const why = (): "hold" | "add_reps" =>
    first < lo || first >= hi ? "hold" : "add_reps";
  if (guide.progression === "reps" || kg === null) {
    if (ready) return { reason: "add_load", sets, reps: [lo, hi], loadKg: null };
    return { reason: why(), sets, reps: aim(), loadKg: null };
  }
  const n = Number(kg);
  if (
    tooHard(
      guide,
      work.filter((s) => s.loadKg !== null && Number(s.loadKg) === n),
    )
  ) {
    if (prior.length && tooHard(guide, prior)) {
      const down = Math.max(0, round2(n - step(Math.max(0, n - 0.01))));
      return { reason: "reduce", sets, reps: [lo, hi], loadKg: String(down) };
    }
    return {
      reason: "hold_effort",
      sets,
      reps: [Math.min(hi, Math.max(lo, weakest)), hi],
      loadKg: kg,
    };
  }
  if (ready)
    return {
      reason: "add_load",
      sets,
      reps: [lo, hi],
      loadKg: String(round2(n + step(n))),
    };
  return { reason: why(), sets, reps: aim(), loadKg: kg };
}
