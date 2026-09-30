/** Tests for the ingredient upsert: create, update with a field diff, no-op, isolation. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { createIngredient, listIngredients } from "../nutrition/repositories/ingredients";
import { createTestDb, createTestUser, ingredientFixture } from "../testing/test-db";
import { applyUpsert, parseUpsertFile, planUpsert } from "./ingredients-upsert";

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

const row = (o: Record<string, unknown>) => ({
  name: "Oats",
  description: "",
  unit: "g",
  kcal: "372",
  protein: "13.5",
  carbs: "58.7",
  sugars: "0.7",
  fat: "7",
  saturatedFat: "1.3",
  fiber: "10",
  salt: "0.01",
  packagePriceCents: 189,
  packageSize: "500",
  ...o,
});

describe("ingredient upsert", () => {
  it("creates new names, updates changed fields, ignores identical rows", async () => {
    await createIngredient(db, me, ingredientFixture()); // "Oats", 189 c / 500 g
    await createIngredient(db, other, ingredientFixture()); // same name, other user
    const parsed = parseUpsertFile({
      format: "lifeos-ingredients",
      version: 1,
      ingredients: [
        row({ packagePriceCents: 89 }),
        row({ name: "Chickpeas", kcal: "117" }),
      ],
    });
    if (!parsed.ok) throw new Error("file should parse");
    const plan = await planUpsert(db, me, parsed.value);
    expect(plan.map((p) => p.action)).toEqual(["update", "create"]);
    expect(plan[0]).toMatchObject({
      changes: [{ field: "packagePriceCents", from: "189", to: "89" }],
    });

    expect(await applyUpsert(db, me, plan)).toEqual([]);
    const mine = await listIngredients(db, me);
    expect(mine.map((i) => [i.name, i.packagePriceCents])).toEqual([
      ["Chickpeas", 189],
      ["Oats", 89],
    ]);
    // Re-planning the same file: nothing left to do.
    expect((await planUpsert(db, me, parsed.value)).map((p) => p.action)).toEqual([
      "same",
      "same",
    ]);
    // CROSS-USER: the other user's "Oats" kept its price.
    expect((await listIngredients(db, other))[0]?.packagePriceCents).toBe(189);
  });

  it("rejects half a price and bad decimals", () => {
    expect(
      parseUpsertFile({
        format: "lifeos-ingredients",
        version: 1,
        ingredients: [row({ packageSize: null })],
      }).ok,
    ).toBe(false);
    expect(
      parseUpsertFile({
        format: "lifeos-ingredients",
        version: 1,
        ingredients: [row({ kcal: "1.23456" })],
      }).ok,
    ).toBe(false);
  });
});
