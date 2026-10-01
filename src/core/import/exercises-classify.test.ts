/** Tests for core/import/exercises-classify.ts, on PGlite with the real migrations. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { createTestDb, createTestUser } from "../testing/test-db";
import { createExercise, listExercises } from "../training/repositories/exercises";
import type { ExerciseInput } from "../training/validation";
import { applyClassification, planClassification } from "./exercises-classify";

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

const exercise = (name: string, v: Partial<ExerciseInput> = {}): ExerciseInput => ({
  name,
  kind: "strength",
  muscleGroups: [],
  pattern: null,
  equipment: null,
  unilateral: false,
  notes: "",
  ...v,
});

describe("classification of existing exercises", () => {
  it("fills empty fields and replaces free-text groups, never a choice made", async () => {
    await createExercise(db, me, exercise("Lat pulldown"));
    await createExercise(
      db,
      me,
      exercise("Pulley row", { muscleGroups: ["dorsali"] as never }),
    );
    await createExercise(
      db,
      me,
      exercise("Preacher curl", { muscleGroups: ["forearms"] }),
    );
    await createExercise(db, me, exercise("Farmer's walk"));
    await createExercise(db, other, exercise("Shoulder press"));

    const plan = await planClassification(db, me);
    expect(plan.unknown).toEqual(["Farmer's walk"]);
    expect(
      plan.changes.map((c) => [
        c.name,
        c.pattern?.to ?? null,
        c.muscleGroups?.to[0] ?? null,
      ]),
    ).toEqual([
      ["Lat pulldown", "vertical_pull", "lats"],
      ["Preacher curl", "curl", null], // groups were chosen: kept
      ["Pulley row", "horizontal_pull", "upper_back"],
    ]);

    expect(await applyClassification(db, me, plan.changes)).toBe(3);
    const byName = new Map((await listExercises(db, me)).map((e) => [e.name, e]));
    expect(byName.get("Preacher curl")!.muscleGroups).toEqual(["forearms"]);
    expect(byName.get("Pulley row")!.pattern).toBe("horizontal_pull");
    // Re-running finds nothing left to do; the other user is untouched.
    expect((await planClassification(db, me)).changes).toEqual([]);
    expect((await listExercises(db, other))[0]!.pattern).toBeNull();
  });
});
