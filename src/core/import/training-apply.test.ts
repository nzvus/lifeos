/** Tests for the training import (ADR-0005): plan, apply, idempotence, aliases. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { createTestDb, createTestUser } from "../testing/test-db";
import { listExercises } from "../training/repositories/exercises";
import { weightOn } from "../training/repositories/measurements";
import { listRoutines } from "../training/repositories/routines";
import { listSessions } from "../training/repositories/sessions";
import { parseFitforgeTraining } from "./fitforge-training";
import { parseGymLog, toPlannedSession } from "./gym-log";
import { applyTrainingImport, planTrainingImport, sessionExists } from "./training-apply";
import { plainSet } from "./training-plan";

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

const LOG = `PULL

Pause da 1.30

Chest supp row
2x10 con 2 da 15

Hanging folded legs raises
3x10

Compiuto in circa 1 ora`;

const FITFORGE = {
  workoutSessions: [
    {
      date: "2026-05-29T12:00:00.000Z",
      durationMin: 20,
      notes: null,
      exercises: [
        {
          name: "Treadmill",
          type: "treadmill",
          durationMin: 20,
          speedKmh: 5,
          inclinePercent: 12,
          sets: [],
        },
      ],
    },
    {
      date: "2026-05-29T12:00:00.000Z",
      durationMin: 56,
      notes: null,
      exercises: [
        {
          name: "Chest Supported Row",
          type: "strength",
          sets: [{ reps: 8, weightKg: 40, restAfterS: 110 }],
        },
      ],
    },
  ],
  workoutPresets: [
    {
      name: "Pull",
      exercises: [
        {
          name: "Chest Supported Row",
          defaultSets: 3,
          defaultReps: 8,
          defaultWeightKg: 40,
          defaultRestAfterS: 110,
        },
      ],
    },
  ],
  bodyMetrics: [
    {
      date: "2026-05-31T00:00:00.000Z",
      weightKg: 76,
      bodyFatPct: 15.1,
      waistCm: 79,
      notes: null,
      formulaUsed: "navy",
    },
  ],
};

function input() {
  const ff = parseFitforgeTraining(FITFORGE);
  return {
    sessions: [
      toPlannedSession(parseGymLog("PULL 1_260915_143631.txt", LOG)),
      ...ff.sessions,
    ],
    routines: ff.routines,
    measurements: ff.measurements,
    // Two names for one machine: the log's wins.
    aliases: { "Chest Supported Row": "Chest supp row" },
  };
}

describe("training import", () => {
  it("plans, applies through the repositories, and adds nothing on a second run", async () => {
    const plan = await planTrainingImport(db, me, input());
    expect(plan.newExercises).toEqual([
      { name: "Chest supp row", kind: "strength" },
      { name: "Hanging folded legs raises", kind: "bodyweight" },
      { name: "Treadmill", kind: "cardio" },
    ]);
    expect(plan.sessions.map((s) => [s.label, s.day, s.exists])).toEqual([
      ["PULL 1", "2026-09-15", false],
      ["Tapis roulant", "2026-05-29", false],
      ["Pull", "2026-05-29", false],
    ]);

    const r = await applyTrainingImport(db, me, input(), "Europe/Rome");
    expect(r).toEqual({
      created: { exercises: 3, sessions: 3, routines: 1, measurements: 1 },
      failed: [],
    });
    const sessions = await listSessions(db, me, "2026-01-01", "2026-12-31");
    const row = sessions.find((s) => s.label === "PULL 1")!.exercises[0]!;
    expect([row.name, row.sets[0]!.loadKg, row.sets[0]!.loadText, row.restS]).toEqual([
      "Chest supp row",
      "30.00",
      "2×15",
      90,
    ]);
    const tread = sessions.find((s) => s.label === "Tapis roulant")!.exercises[0]!
      .sets[0]!;
    expect([tread.durationS, tread.speedKmh, tread.inclinePct]).toEqual([
      1200,
      "5.0",
      "12.0",
    ]);
    expect((await listRoutines(db, me))[0]?.items[0]?.name).toBe("Chest supp row");
    expect(await weightOn(db, me, "2026-09-30")).toBe("76.00");
    expect(await sessionExists(db, me, "2026-09-15", "PULL 1")).toBe(true);

    const again = await applyTrainingImport(db, me, input(), "Europe/Rome");
    expect(again.created).toEqual({
      exercises: 0,
      sessions: 0,
      routines: 0,
      measurements: 0,
    });
    expect(await listExercises(db, me)).toHaveLength(3);

    // CROSS-USER: nothing leaked to the other account.
    expect(await listSessions(db, other, "2026-01-01", "2026-12-31")).toEqual([]);
  });

  it("shows in the dry run a session that saving would refuse", async () => {
    const bare = {
      label: "X",
      day: "2026-09-20",
      time: null,
      durationMin: null,
      notes: "",
      exercises: [
        {
          name: "Lat pulldown",
          notes: "",
          restS: null,
          sets: [
            plainSet({ reps: 10, loadKg: "40" }),
            plainSet({ reps: 8 }), // a strength set with no load
          ],
        },
      ],
    };
    const plan = await planTrainingImport(db, me, { ...input(), sessions: [bare] });
    expect(plan.sessions[0]!.problems).toEqual({
      "exercises.0.sets.1.loadKg": "required",
    });
  });
});
