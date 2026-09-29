/**
 * Tests for the FitForge importer (plan + apply), on real Postgres (PGlite).
 * The fixture is synthetic on purpose: the real export contains personal data
 * and must never be committed.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { createIngredient, listIngredients } from "../nutrition/repositories/ingredients";
import { listMeals } from "../nutrition/repositories/meals";
import { createTestDb, createTestUser, ingredientFixture } from "../testing/test-db";
import { planFitForgeImport, type ImportPlan } from "./fitforge";
import { applyFitForgeImport } from "./fitforge-apply";

/** A FitForge ingredient with sensible defaults, overridable per test. */
function ffIngredient(o: Record<string, unknown>) {
  return {
    id: "ff-" + String(o.name),
    userId: "ff-user",
    name: "X",
    unit: "g",
    caloriesPer: 100,
    proteinPer: 10,
    carbsPer: 10,
    fatPer: 1,
    fiberPer: 1,
    sugarsPer: 1,
    saturatedFatPer: 0.5,
    saltPer: 0.01,
    store: null,
    priceEuro: null,
    priceQuantityG: null,
    nutritionalNotes: null,
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
    ...o,
  };
}

const fixture = {
  exportVersion: "1.0",
  fitforgeVersion: "2.4.0",
  ingredients: [
    ffIngredient({
      name: "Basilico",
      caloriesPer: 23,
      store: "Lidl",
      priceEuro: 0.99,
      priceQuantityG: 30,
      nutritionalNotes: "Fresh",
    }),
    ffIngredient({
      name: "Latte",
      unit: "ml",
      caloriesPer: 46,
      priceEuro: 1.59,
      priceQuantityG: 1000,
    }),
    ffIngredient({ name: "Skyr", priceEuro: null, priceQuantityG: 450 }), // half a price
    ffIngredient({ name: "Rotto", caloriesPer: null }), // invalid: kcal missing
  ],
  meals: [
    {
      id: "m1",
      name: "Pesto",
      items: [
        {
          id: "i1",
          ingredientId: "ff-Basilico",
          ingredientName: "Basilico",
          quantityG: 20,
        },
        { id: "i2", ingredientId: "ff-Latte", ingredientName: "Latte", quantityG: 100 },
      ],
    },
    {
      id: "m2",
      name: "Usa il rotto",
      items: [
        { id: "i3", ingredientId: "ff-Rotto", ingredientName: "Rotto", quantityG: 10 },
      ],
    },
  ],
};

function plan(): ImportPlan {
  const p = planFitForgeImport(fixture);
  if (!p.ok) throw new Error("fixture should plan");
  return p.value;
}

describe("planFitForgeImport (pure)", () => {
  it("maps fields, converts euros to cents, merges store and notes", () => {
    const basil = plan().ingredients.find((i) => i.input.name === "Basilico")!.input;
    expect(basil).toMatchObject({
      kcal: "23",
      unit: "g",
      packagePriceCents: 99,
      packageSize: "30",
      description: "Lidl — Fresh",
    });
  });

  it("drops half a price with an issue, and reports invalid rows and their meals", () => {
    const p = plan();
    expect(
      p.ingredients.find((i) => i.input.name === "Skyr")?.input.packagePriceCents,
    ).toBeNull();
    expect(p.issues).toEqual([
      { kind: "price_dropped", ingredient: "Skyr" },
      { kind: "invalid_ingredient", ingredient: "Rotto", errors: { kcal: "required" } },
      { kind: "meal_missing_ingredient", meal: "Usa il rotto", ingredient: "Rotto" },
    ]);
    expect(p.meals.map((m) => m.name)).toEqual(["Pesto"]);
  });

  it("refuses a file that is not a FitForge export", () => {
    expect(planFitForgeImport({ hello: "world" }).ok).toBe(false);
  });
});

describe("applyFitForgeImport", () => {
  let db: Db;
  let close: () => Promise<void>;
  let me: Owner;

  beforeEach(async () => {
    ({ db, close } = await createTestDb());
    me = await createTestUser(db, "me@example.com");
  });
  afterEach(() => close());

  it("dry run reports what it would do and writes nothing", async () => {
    const report = await applyFitForgeImport(db, me, plan(), { apply: false });
    expect(report.ingredients.created).toEqual(["Basilico", "Latte", "Skyr"]);
    expect(report.meals.created).toEqual(["Pesto"]);
    expect(await listIngredients(db, me)).toEqual([]);
  });

  it("applies, computes meal totals from the imported values, and is idempotent", async () => {
    await applyFitForgeImport(db, me, plan(), { apply: true });
    const [pesto] = await listMeals(db, me);
    // 20 g basil at 23 kcal/100 g = 4.6; 100 ml milk at 46/100 ml = 46.
    expect(pesto?.totals.nutrients.kcal).toBe("50.6");

    const again = await applyFitForgeImport(db, me, plan(), { apply: true });
    expect(again.ingredients.created).toEqual([]);
    expect(again.ingredients.existing).toHaveLength(3);
    expect(again.meals.existing).toEqual(["Pesto"]);
    expect(await listIngredients(db, me)).toHaveLength(3); // no duplicates
  });

  it("reuses an ingredient I already have with the same name", async () => {
    await createIngredient(db, me, ingredientFixture({ name: "Basilico", kcal: "30" }));
    const report = await applyFitForgeImport(db, me, plan(), { apply: true });
    expect(report.ingredients.existing).toEqual(["Basilico"]);
    // The meal uses MY Basilico (30 kcal/100 g): 6 + 46 = 52.
    expect((await listMeals(db, me))[0]?.totals.nutrients.kcal).toBe("52.0");
  });
});
