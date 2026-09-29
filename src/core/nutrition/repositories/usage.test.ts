/** Tests for usage statistics, including cross-user isolation. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import { createIngredient } from "./ingredients";
import { logIngredient, logMeal } from "./log";
import { createMeal } from "./meals";
import { getUsage } from "./usage";

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

describe("getUsage", () => {
  it("counts meals and ingredients (also inside meals) since a day; nothing of others", async () => {
    const oats = await createIngredient(db, me, ingredientFixture());
    const milk = await createIngredient(db, me, ingredientFixture({ name: "Milk" }));
    if (!oats.ok || !milk.ok) throw new Error("setup failed");
    const meal = await createMeal(db, me, {
      name: "Porridge",
      notes: "",
      items: [
        { ingredientId: oats.value.id, quantity: "60" },
        { ingredientId: milk.value.id, quantity: "200" },
      ],
    });
    if (!meal.ok) throw new Error("setup failed");

    await logMeal(db, me, { day: "2026-09-01", mealId: meal.value.id, servings: "1" }); // too old
    await logMeal(db, me, { day: "2026-09-20", mealId: meal.value.id, servings: "1" });
    await logMeal(db, me, { day: "2026-09-25", mealId: meal.value.id, servings: "1" });
    await logIngredient(db, me, {
      day: "2026-09-26",
      ingredientId: oats.value.id,
      quantity: "10",
    });

    const usage = await getUsage(db, me, "2026-09-10");
    expect(usage.meals[meal.value.id]).toEqual({ uses: 2, lastUsed: "2026-09-25" });
    expect(usage.ingredients[oats.value.id]).toEqual({ uses: 3, lastUsed: "2026-09-26" });
    expect(usage.ingredients[milk.value.id]).toEqual({ uses: 2, lastUsed: "2026-09-25" });

    // CROSS-USER: another user's statistics are empty.
    expect(await getUsage(db, other, "2026-01-01")).toEqual({
      meals: {},
      ingredients: {},
    });
  });
});
