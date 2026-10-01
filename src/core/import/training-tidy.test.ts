/** Tests for core/import/training-tidy.ts, on PGlite with the real migrations. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { createTestDb, createTestUser } from "../testing/test-db";
import { createExercise, listExercises } from "../training/repositories/exercises";
import { createRoutine, listRoutines } from "../training/repositories/routines";
import { createSession, listSessions } from "../training/repositories/sessions";
import { applyTidy, planTidy } from "./training-tidy";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

async function setUp(owner: Owner) {
  const ex = await createExercise(db, owner, {
    name: "Lat pulldown",
    kind: "strength",
    pattern: null,
    muscleGroups: [],
    equipment: null,
    unilateral: false,
    notes: "",
  });
  if (!ex.ok) throw new Error("setup");
  const items = [
    {
      exerciseId: ex.value.id,
      restS: null,
      notes: "",
      sets: [
        {
          reps: 10,
          loadKg: "30",
          loadText: null,
          loadApprox: false,
          durationS: null,
          distanceM: null,
          speedKmh: null,
          inclinePct: null,
          restS: null,
          warmup: false,
        },
      ],
    },
  ];
  await createRoutine(db, owner, { name: "Pull", notes: "", items: [] });
  for (const [day, label] of [
    ["2026-05-29", "Pull"],
    ["2026-09-15", "PULL 1"],
    ["2026-09-21", "PULL 2"],
    ["2026-09-22", "Legs"],
  ])
    await createSession(
      db,
      owner,
      {
        day: day!,
        label: label!,
        status: "done",
        time: null,
        durationMin: null,
        notes: "",
        routineId: null,
        exercises: items,
      },
      "Europe/Rome",
    );
}

describe("training tidy", () => {
  it("renames numbered sessions to their routine, links them, adds the outdoor run", async () => {
    await setUp(me);
    await setUp(other);
    const plan = await planTidy(db, me);
    expect(plan.sessions.map((c) => [c.from, c.to])).toEqual([
      ["Pull", "Pull"], // same name, but not linked yet
      ["PULL 1", "Pull"],
      ["PULL 2", "Pull"],
    ]);
    expect(plan.createRunExercise && plan.createRunRoutine).toBe(true);

    await applyTidy(db, me, plan);
    const labels = (await listSessions(db, me, "2000-01-01", "2099-01-01"))
      .map((s) => s.label)
      .sort();
    expect(labels).toEqual(["Legs", "Pull", "Pull", "Pull"]);
    const run = (await listExercises(db, me)).find((e) => e.name === "Corsa all'aperto");
    expect([run?.kind, run?.pattern]).toEqual(["cardio", "run"]);
    expect((await listRoutines(db, me)).map((r) => r.name).sort()).toEqual([
      "Corsa",
      "Pull",
    ]);

    // Re-running has nothing left to do; the other user is untouched.
    expect(await planTidy(db, me)).toEqual({
      sessions: [],
      createRunExercise: false,
      createRunRoutine: false,
    });
    expect((await planTidy(db, other)).sessions).toHaveLength(3);
  });
});
