/**
 * core/training/presets.ts — a routine as a preset that is always at its
 * LATEST version: starting "Push" repeats what the last Push session actually
 * was (its exercises, in order, with their working sets), not what the
 * routine said when it was written. The routine's own items are used only
 * until a session of it exists.
 *
 * A session belongs to a routine when it was started from it (routineId) or
 * when its label is the routine's name plus an optional number ("PUSH 5" is
 * a "Push"), so the imported text logs count too. A new session is called
 * like its routine, with no number: the date already orders the runs, and
 * "PUSH 5" and "PUSH 6" are the same routine (developer, 2026-10-01). Pure.
 */

/** What a preset set carries (a stored set row has more). */
export type PresetSet = {
  reps: number | null;
  loadKg: string | null;
  loadText?: string | null;
  loadApprox?: boolean;
  durationS?: number | null;
  distanceM?: number | null;
  speedKmh?: string | null;
  inclinePct?: string | null;
  warmup: boolean;
};

export type PresetExercise<S> = { exerciseId: string; restS: number | null; sets: S[] };

export type Preset<S> = {
  /** The routine's name. */
  label: string;
  /** Where the exercises come from: the last session of the routine, or its items. */
  from: { kind: "session"; day: string; label: string } | { kind: "routine" };
  exercises: PresetExercise<S>[];
};

/** "PUSH 5" -> { family: "push", n: 5 }; "Legs" -> { family: "legs", n: null }. */
export function labelFamily(label: string): { family: string; n: number | null } {
  const m = /^(.*?)\s*(\d+)\s*$/.exec(label.trim());
  return m && m[1]
    ? { family: m[1].toLowerCase(), n: Number(m[2]) }
    : { family: label.trim().toLowerCase(), n: null };
}

export function latestPreset<S extends PresetSet>(
  routine: {
    id: string;
    name: string;
    items: readonly {
      exerciseId: string;
      sets: number;
      reps: number | null;
      loadKg: string | null;
      durationS: number | null;
      restS: number | null;
    }[];
  },
  sessions: readonly {
    day: string;
    label: string;
    status: string;
    routineId: string | null;
    exercises: readonly {
      exerciseId: string;
      restS: number | null;
      sets: readonly S[];
    }[];
  }[],
  /** Builds a set from a routine item's defaults. */
  fromItem: (item: {
    reps: number | null;
    loadKg: string | null;
    durationS: number | null;
  }) => S,
): Preset<S> {
  const family = labelFamily(routine.name).family;
  const mine = sessions.filter(
    (s) =>
      s.status === "done" &&
      (s.routineId === routine.id || labelFamily(s.label).family === family),
  );
  const last = [...mine].sort((a, b) => a.day.localeCompare(b.day)).at(-1);
  const label = routine.name;
  if (!last)
    return {
      label,
      from: { kind: "routine" },
      exercises: routine.items.map((it) => ({
        exerciseId: it.exerciseId,
        restS: it.restS,
        sets: Array.from({ length: it.sets }, () => fromItem(it)),
      })),
    };
  return {
    label,
    from: { kind: "session", day: last.day, label: last.label },
    exercises: last.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      restS: e.restS,
      sets: e.sets.filter((s) => !s.warmup),
    })),
  };
}
