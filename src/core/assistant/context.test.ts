/** Tests for core/assistant/context.ts: the picture names the user's own things, only theirs. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { createIngredient } from "../nutrition/repositories/ingredients";
import { logMeal } from "../nutrition/repositories/log";
import { createMeal } from "../nutrition/repositories/meals";
import { createTestDb, createTestUser, ingredientFixture } from "../testing/test-db";
import { createExercise } from "../training/repositories/exercises";
import { addMeasurement } from "../training/repositories/measurements";
import { createRoutine } from "../training/repositories/routines";
import { userContext } from "./context";

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

describe("userContext", () => {
  it("lists my meals, ingredients, routines, days and weight — not someone else's", async () => {
    const oats = await createIngredient(db, me, ingredientFixture({ name: "Avena" }));
    const theirs = await createIngredient(
      db,
      other,
      ingredientFixture({ name: "Secret" }),
    );
    if (!oats.ok || !theirs.ok) throw new Error("setup");
    const meal = await createMeal(db, me, {
      name: "Porridge",
      notes: "",
      items: [{ ingredientId: oats.value.id, quantity: "60" }],
    });
    if (!meal.ok) throw new Error("setup");
    await logMeal(db, me, { day: "2026-09-30", mealId: meal.value.id, servings: "1" });
    const lat = await createExercise(db, me, {
      name: "Lat pulldown",
      kind: "strength",
      muscleGroups: [],
      pattern: null,
      equipment: null,
      unilateral: false,
      notes: "",
    });
    if (!lat.ok) throw new Error("setup");
    await createRoutine(db, me, {
      name: "PULL",
      notes: "",
      items: [
        {
          exerciseId: lat.value.id,
          sets: 3,
          reps: 10,
          loadKg: "40",
          durationS: null,
          restS: 80,
        },
      ],
    });
    await addMeasurement(db, me, {
      day: "2026-09-20",
      weightKg: "76",
      bodyFatPct: null,
      waistCm: null,
      notes: "",
    });

    const text = await userContext(db, me, "2026-10-01");
    expect(text).toContain("Porridge: 223 kcal");
    expect(text).toContain("Avena 60g");
    expect(text).toContain("PULL: Lat pulldown");
    expect(text).toContain("2026-09-30: 223 /");
    expect(text).toContain("weight 76 kg on 2026-09-20");
    expect(text).not.toContain("Secret");
    expect(await userContext(db, other, "2026-10-01")).not.toContain("Porridge");
  });
});
