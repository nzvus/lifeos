/** Reps left per set (ADR-0049) against a real Postgres (PGlite). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { createExercise } from "./exercises";
import { createSession, lastSets } from "./sessions";

let db: Db;
let close: () => Promise<void>;
let me: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
});
afterEach(() => close());

const set = (reps: number, rir: number | null) => ({
  reps,
  loadKg: "40",
  loadText: null,
  loadApprox: false,
  durationS: null,
  distanceM: null,
  speedKmh: null,
  inclinePct: null,
  warmup: false,
  done: true,
  rir,
});

async function session(exerciseId: string, rirs: (number | null)[]) {
  return createSession(
    db,
    me,
    {
      label: "Pull",
      day: "2026-10-09",
      status: "done",
      time: "",
      durationMin: 50,
      notes: "",
      routineId: null,
      exercises: [
        { exerciseId, notes: "", restS: null, sets: rirs.map((r) => set(10, r)) },
      ],
    },
    "Europe/Rome",
  );
}

describe("sets' reps left", () => {
  it("are saved and read back with the last sets; not said = null", async () => {
    const lat = await createExercise(db, me, {
      name: "Lat pulldown",
      kind: "strength",
      muscleGroups: ["lats"],
      pattern: null,
      equipment: null,
      unilateral: false,
      notes: "",
    });
    if (!lat.ok) throw new Error("setup");
    expect((await session(lat.value.id, [2, 1, null])).ok).toBe(true);
    const last = (await lastSets(db, me, [lat.value.id])).get(lat.value.id)!;
    expect(last.sets.map((s) => s.rir)).toEqual([2, 1, null]);
  });

  it("refuses a value outside 0–4", async () => {
    const lat = await createExercise(db, me, {
      name: "Row",
      kind: "strength",
      muscleGroups: ["lats"],
      pattern: null,
      equipment: null,
      unilateral: false,
      notes: "",
    });
    if (!lat.ok) throw new Error("setup");
    await expect(session(lat.value.id, [7])).rejects.toThrow();
  });
});
