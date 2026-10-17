/**
 * core/training/plan.ts — the sets gym mode proposes for an exercise (V-05):
 * E6's double progression (`nextTarget`) on the guide of its movement
 * pattern, from its last two sessions. With no known pattern ("other"), the
 * last session's working sets as they were; with no history either, 3 × 10.
 * Pure: the proposal only fills the steppers; what is lifted is typed.
 */
import { GUIDES, nextTarget, type Guide, type LastSet } from "../engines/training";

export type ProposedSet = {
  reps: number | null;
  loadKg: string | null;
  durationS: number | null;
};

export function guideOf(pattern: string | null | undefined): Guide | null {
  return pattern && pattern in GUIDES ? GUIDES[pattern as keyof typeof GUIDES] : null;
}

export function proposeSets(
  pattern: string | null | undefined,
  last: readonly LastSet[] | undefined,
  before?: readonly LastSet[],
): { sets: ProposedSet[]; reason: string } {
  const guide = guideOf(pattern);
  const work = (last ?? []).filter((s) => !s.warmup);
  if (!guide) {
    if (work.length === 0)
      return {
        sets: Array.from({ length: 3 }, () => ({
          reps: 10,
          loadKg: null,
          durationS: null,
        })),
        reason: "start",
      };
    return {
      sets: work.map((s) => ({ reps: s.reps, loadKg: s.loadKg, durationS: s.durationS })),
      reason: "hold",
    };
  }
  const t = nextTarget(guide, last, before);
  if ("reps" in t) {
    const reps = t.reps[0];
    const loadKg =
      "loadKg" in t ? t.loadKg : (work.find((s) => s.loadKg !== null)?.loadKg ?? null);
    return {
      sets: Array.from({ length: t.sets }, () => ({ reps, loadKg, durationS: null })),
      reason: t.reason,
    };
  }
  const seconds = t.minutes ? t.minutes * 60 : (t.seconds ?? null);
  return {
    sets: Array.from({ length: t.sets }, () => ({
      reps: null,
      loadKg: null,
      durationS: seconds,
    })),
    reason: t.reason,
  };
}
