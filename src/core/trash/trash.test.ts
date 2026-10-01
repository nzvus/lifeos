/**
 * Tests for core/trash/trash.ts: the trash page's list, restore and delete
 * for good, and the daily purge — on PGlite with the real migrations.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import { exercises, ingredients, meals, routines } from "../db/schema";
import type { Owner } from "../identity/owner";
import {
  createIngredient,
  deleteIngredient,
  listIngredients,
} from "../nutrition/repositories/ingredients";
import { createMeal, deleteMeal, listMeals } from "../nutrition/repositories/meals";
import { createTestDb, createTestUser, ingredientFixture } from "../testing/test-db";
import { createExercise, deleteExercise } from "../training/repositories/exercises";
import { addMeasurement, deleteMeasurement } from "../training/repositories/measurements";
import { createRoutine, deleteRoutine } from "../training/repositories/routines";
import { listTrash, purgeExpiredTrash, purgeFromTrash, restoreFromTrash } from "./trash";

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

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-01T03:00:00Z");
const ago = (days: number) => new Date(NOW.getTime() - days * DAY);

/** Oats in a "Porridge" meal; returns both ids. */
async function porridge() {
  const oats = await createIngredient(db, me, ingredientFixture());
  if (!oats.ok) throw new Error("setup");
  const meal = await createMeal(db, me, {
    name: "Porridge",
    notes: "",
    items: [{ ingredientId: oats.value.id, quantity: "60" }],
  });
  if (!meal.ok) throw new Error("setup");
  return { oatsId: oats.value.id, mealId: meal.value.id };
}

/** "Lat pulldown" in a "PULL" routine; returns both ids. */
async function pull() {
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
  const routine = await createRoutine(db, me, {
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
  if (!routine.ok) throw new Error("setup");
  return { latId: lat.value.id, routineId: routine.value.id };
}

describe("the trash page", () => {
  it("lists every kind, newest first, only mine; restore takes it back out", async () => {
    const { mealId } = await porridge();
    const m = await addMeasurement(db, me, {
      day: "2026-09-30",
      weightKg: "74.5",
      bodyFatPct: null,
      waistCm: null,
      notes: "",
    });
    if (!m.ok) throw new Error("setup");
    await deleteMeal(db, me, mealId);
    await deleteMeasurement(db, me, m.value.id);

    const trash = await listTrash(db, me);
    expect(trash.map((x) => [x.kind, x.name, x.day])).toEqual([
      ["measurement", "74.50", "2026-09-30"],
      ["meal", "Porridge", null],
    ]);
    // It says when the purge will take it: 30 days after deleting.
    const [first] = trash;
    expect(Date.parse(first!.purgeAt) - Date.parse(first!.deletedAt)).toBe(30 * DAY);
    // CROSS-USER: not in someone else's trash, and they can't restore it.
    expect(await listTrash(db, other)).toEqual([]);
    expect((await restoreFromTrash(db, other, "meal", mealId)).ok).toBe(false);

    expect((await restoreFromTrash(db, me, "meal", mealId)).ok).toBe(true);
    expect((await listMeals(db, me)).map((x) => x.name)).toEqual(["Porridge"]);
    expect((await listTrash(db, me)).map((x) => x.kind)).toEqual(["measurement"]);
  });

  it("deletes for good only from the trash, and not what something still uses", async () => {
    const { oatsId, mealId } = await porridge();
    // A live record is never deleted here.
    expect(await purgeFromTrash(db, me, "meal", mealId)).toEqual({
      ok: false,
      errors: { _form: "not_found" },
    });
    await deleteMeal(db, me, mealId);
    await deleteIngredient(db, me, oatsId); // allowed: the meal is in the trash
    // The meal in the trash still holds the oats.
    expect(await purgeFromTrash(db, me, "ingredient", oatsId)).toEqual({
      ok: false,
      errors: { _form: "still_referenced" },
    });
    // CROSS-USER: someone else can't delete it.
    expect((await purgeFromTrash(db, other, "meal", mealId)).ok).toBe(false);

    expect((await purgeFromTrash(db, me, "meal", mealId)).ok).toBe(true);
    expect((await purgeFromTrash(db, me, "ingredient", oatsId)).ok).toBe(true);
    expect(await listTrash(db, me)).toEqual([]);
    expect(await listIngredients(db, me)).toEqual([]);
  });
});

describe("the daily purge", () => {
  it("deletes what has been in the trash over 30 days, containers first", async () => {
    const { oatsId, mealId } = await porridge();
    const { latId, routineId } = await pull();
    await deleteMeal(db, me, mealId);
    await deleteIngredient(db, me, oatsId);
    await deleteRoutine(db, me, routineId);
    await deleteExercise(db, me, latId);
    // Meal and oats: 31 days. Routine: 31 days, its exercise: 31 days.
    await db.update(meals).set({ deletedAt: ago(31) });
    await db.update(ingredients).set({ deletedAt: ago(31) });
    await db.update(routines).set({ deletedAt: ago(31) });
    await db.update(exercises).set({ deletedAt: ago(31) });

    expect(await purgeExpiredTrash(db, NOW)).toMatchObject({
      meal: 1,
      ingredient: 1,
      routine: 1,
      exercise: 1,
    });
    expect(await listTrash(db, me)).toEqual([]);
  });

  it("keeps what is younger, and skips what a younger record still uses", async () => {
    const { oatsId, mealId } = await porridge();
    await deleteMeal(db, me, mealId);
    await deleteIngredient(db, me, oatsId);
    await db.update(meals).set({ deletedAt: ago(29) }); // not yet
    await db.update(ingredients).set({ deletedAt: ago(31) }); // due, but the meal holds it

    expect(await purgeExpiredTrash(db, NOW)).toMatchObject({ meal: 0, ingredient: 0 });
    expect((await listTrash(db, me)).map((x) => x.kind).sort()).toEqual([
      "ingredient",
      "meal",
    ]);
    // Two days later both go.
    expect(await purgeExpiredTrash(db, new Date(NOW.getTime() + 2 * DAY))).toMatchObject({
      meal: 1,
      ingredient: 1,
    });
  });

  it("never touches live records, of anyone", async () => {
    await porridge();
    await pull();
    const counts = await purgeExpiredTrash(db, NOW);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
    expect(await listMeals(db, me)).toHaveLength(1);
  });
});
