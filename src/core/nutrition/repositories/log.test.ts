/**
 * Tests for meals + daily log: totals computed on read, the snapshot rule
 * (ADR-0007), and cross-user isolation of meals and log entries.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import { createIngredient, deleteIngredient, updateIngredient } from "./ingredients";
import { copyDay, deleteLogEntry, getDay, logIngredient, logMeal } from "./log";
import { createMeal, deleteMeal, getMeal, listMeals, updateMeal } from "./meals";

let db: Db;
let close: () => Promise<void>;
let alice: Owner;
let bob: Owner;
let oatsId: string;
let milkId: string;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  alice = await createTestUser(db, "alice@example.com");
  bob = await createTestUser(db, "bob@example.com");
  const oats = await createIngredient(db, alice, ingredientFixture()); // 372 kcal/100 g
  const milk = await createIngredient(
    db,
    alice,
    ingredientFixture({
      name: "Milk",
      unit: "ml",
      kcal: "46",
      packagePriceCents: null,
      packageSize: null,
    }),
  );
  if (!oats.ok || !milk.ok) throw new Error("setup failed");
  oatsId = oats.value.id;
  milkId = milk.value.id;
});
afterEach(() => close());

async function porridge() {
  const r = await createMeal(db, alice, {
    name: "Porridge",
    notes: "",
    items: [
      { ingredientId: oatsId, quantity: "60" }, // 223.2 kcal
      { ingredientId: milkId, quantity: "200" }, // 92 kcal
    ],
  });
  if (!r.ok) throw new Error("setup failed");
  return r.value.id;
}

describe("meals", () => {
  it("computes totals from lines on read", async () => {
    const id = await porridge();
    const meal = await getMeal(db, alice, id);
    expect(meal?.totals.nutrients.kcal).toBe("315.2");
    // Milk has no price -> the cost is a lower bound, and flagged as such.
    expect(meal?.totals).toMatchObject({ costCents: 23, costComplete: false });
  });

  it("follows ingredient edits (a recipe should)", async () => {
    const id = await porridge();
    await updateIngredient(db, alice, oatsId, ingredientFixture({ kcal: "400" }));
    expect((await getMeal(db, alice, id))?.totals.nutrients.kcal).toBe("332.0"); // 240 + 92
  });

  it("CROSS-USER: another user cannot read, edit, delete or use my meals/ingredients", async () => {
    const id = await porridge();
    expect(await listMeals(db, bob)).toEqual([]);
    expect(await getMeal(db, bob, id)).toBeNull();
    const input = {
      name: "X",
      notes: "",
      items: [{ ingredientId: oatsId, quantity: "1" }],
    };
    expect(await updateMeal(db, bob, id, input)).toEqual({
      ok: false,
      errors: { "items.0.ingredientId": "not_found" }, // Alice's oats are invisible to Bob
    });
    expect(await createMeal(db, bob, input)).toEqual({
      ok: false,
      errors: { "items.0.ingredientId": "not_found" },
    });
    expect((await deleteMeal(db, bob, id)).ok).toBe(false);
    expect((await getMeal(db, alice, id))?.name).toBe("Porridge");
  });
});

describe("daily log", () => {
  const day = "2026-09-29";

  it("day totals equal the sum of entries, with servings applied", async () => {
    const mealId = await porridge();
    await logMeal(db, alice, { day, mealId, servings: "1.5" }); // 472.8
    await logIngredient(db, alice, { day, ingredientId: oatsId, quantity: "10" }); // 37.2
    const view = await getDay(db, alice, day);
    expect(view.entries.map((e) => e.totals.nutrients.kcal)).toEqual(["472.8", "37.2"]);
    expect(view.totals.nutrients.kcal).toBe("510.0");
  });

  it("SNAPSHOT (ADR-0007): later edits and deletions never change logged history", async () => {
    const mealId = await porridge();
    await logMeal(db, alice, { day, mealId, servings: "1" });
    const before = await getDay(db, alice, day);

    // Change the ingredient, rewrite the meal, then delete the meal entirely.
    await updateIngredient(db, alice, oatsId, ingredientFixture({ kcal: "999" }));
    await updateMeal(db, alice, mealId, {
      name: "Porridge v2",
      notes: "",
      items: [{ ingredientId: oatsId, quantity: "500" }],
    });
    await deleteMeal(db, alice, mealId);

    const after = await getDay(db, alice, day);
    expect(after.totals).toEqual(before.totals);
    expect(after.entries[0]?.label).toBe("Porridge"); // the name at logging time
    expect(after.entries[0]?.mealId).toBeNull(); // the link is gone, the data isn't
  });

  it("keeps a single-ingredient entry after the ingredient is deleted", async () => {
    await logIngredient(db, alice, { day, ingredientId: milkId, quantity: "100" });
    expect((await deleteIngredient(db, alice, milkId)).ok).toBe(true);
    expect((await getDay(db, alice, day)).totals.nutrients.kcal).toBe("46.0");
  });

  it("CROSS-USER: another user cannot see, log from, or delete my entries", async () => {
    const mealId = await porridge();
    const entry = await logMeal(db, alice, { day, mealId, servings: "1" });
    if (!entry.ok) throw new Error("setup failed");

    expect((await getDay(db, bob, day)).entries).toEqual([]);
    expect(await logMeal(db, bob, { day, mealId, servings: "1" })).toEqual({
      ok: false,
      errors: { mealId: "not_found" },
    });
    expect(
      await logIngredient(db, bob, { day, ingredientId: oatsId, quantity: "1" }),
    ).toEqual({
      ok: false,
      errors: { ingredientId: "not_found" },
    });
    expect((await deleteLogEntry(db, bob, entry.value.id)).ok).toBe(false);
    expect((await getDay(db, alice, day)).entries).toHaveLength(1);
  });

  it("copyDay repeats a day's food as logged, and nothing of another user", async () => {
    const mealId = await porridge();
    await logMeal(db, alice, { day, mealId, servings: "1.5" });
    await logIngredient(db, alice, { day, ingredientId: oatsId, quantity: "10" });
    // A later recipe change must NOT leak into the copy (ADR-0007).
    await updateIngredient(db, alice, oatsId, ingredientFixture({ kcal: "999" }));

    expect(await copyDay(db, alice, day, "2026-09-30")).toEqual({
      ok: true,
      value: { copied: 2 },
    });
    const copy = await getDay(db, alice, "2026-09-30");
    const original = await getDay(db, alice, day);
    expect(copy.totals).toEqual(original.totals);
    expect(copy.entries.map((e) => [e.label, e.servings])).toEqual([
      ["Porridge", "1.50"],
      ["Oats", "1.00"],
    ]);

    // CROSS-USER: Bob copying Alice's day copies nothing (he sees no entries).
    expect(await copyDay(db, bob, day, "2026-09-30")).toEqual({
      ok: true,
      value: { copied: 0 },
    });
    expect((await getDay(db, bob, "2026-09-30")).entries).toEqual([]);
  });
});
