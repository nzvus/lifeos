/**
 * Tests for cooking batches (ADR-0017): N portions of a meal, portions left,
 * a portion logged from the batch, and the pantry taking the ingredients
 * once — when cooking, never again when eating a portion.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { addPurchase, createProduct } from "../../pantry/repositories/products";
import { getPantry } from "../../pantry/repositories/stock";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import { cookBatch, deleteBatch, listBatches, restoreBatch } from "./batches";
import { createIngredient } from "./ingredients";
import { getDay, logPortion } from "./log";
import { createMeal } from "./meals";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;
let oatsId: string;
let mealId: string;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
  const oats = await createIngredient(db, me, ingredientFixture()); // 372 kcal / 100 g
  if (!oats.ok) throw new Error("setup failed");
  oatsId = oats.value.id;
  const meal = await createMeal(db, me, {
    name: "Porridge",
    notes: "",
    items: [{ ingredientId: oatsId, quantity: "60" }], // one serving
  });
  if (!meal.ok) throw new Error("setup failed");
  mealId = meal.value.id;
});
afterEach(() => close());

const cooked = new Date("2026-10-05T08:00:00Z");

describe("batches", () => {
  it("cook N portions; logging one takes a portion with one serving's food", async () => {
    const b = await cookBatch(db, me, {
      mealId,
      portions: 4,
      day: "2026-10-05",
      cookedAt: cooked,
    });
    if (!b.ok) throw new Error("cook failed");
    expect((await listBatches(db, me)).map((x) => [x.label, x.portionsLeft])).toEqual([
      ["Porridge", "4"],
    ]);

    const e = await logPortion(db, me, {
      batchId: b.value.id,
      day: "2026-10-06",
      servings: "1",
    });
    expect(e.ok).toBe(true);
    expect((await listBatches(db, me))[0]?.portionsLeft).toBe("3");
    // The entry is one serving: 60 g of oats, 223.2 kcal.
    const day = await getDay(db, me, "2026-10-06");
    expect(day.entries[0]?.lines[0]?.quantity).toBe("60.00");
    expect(day.totals.nutrients.kcal).toBe("223.2");
  });

  it("the pantry takes the ingredients when cooking, not again when eating", async () => {
    const p = await createProduct(db, me, {
      name: "Avena 1 kg",
      brand: "",
      unit: "g",
      packageSize: "1000",
      ingredientId: oatsId,
      shop: "",
      notes: "",
    });
    if (!p.ok) throw new Error("setup failed");
    await addPurchase(db, me, {
      productId: p.value.id,
      day: "2026-10-01",
      packages: "1",
      priceCents: null,
      shop: "",
    });
    const b = await cookBatch(db, me, {
      mealId,
      portions: 4,
      day: "2026-10-05",
      cookedAt: cooked,
    });
    if (!b.ok) throw new Error("cook failed");
    await logPortion(db, me, { batchId: b.value.id, day: "2026-10-06", servings: "2" });
    const [oats] = await getPantry(db, me, new Date("2026-10-07T00:00:00Z"));
    expect(oats?.quantity).toBe("760"); // 1000 − 4 × 60, once
  });

  it("are mine only; in the trash they leave the list and come back", async () => {
    const b = await cookBatch(db, me, {
      mealId,
      portions: 2,
      day: "2026-10-05",
      cookedAt: cooked,
    });
    if (!b.ok) throw new Error("cook failed");
    // CROSS-USER: no cooking with my meal, no portion from my batch.
    expect(
      (
        await cookBatch(db, other, {
          mealId,
          portions: 2,
          day: "2026-10-05",
          cookedAt: cooked,
        })
      ).ok,
    ).toBe(false);
    expect(
      await logPortion(db, other, {
        batchId: b.value.id,
        day: "2026-10-06",
        servings: "1",
      }),
    ).toEqual({
      ok: false,
      errors: { batchId: "not_found" },
    });
    expect(await listBatches(db, other)).toEqual([]);
    expect((await deleteBatch(db, me, b.value.id)).ok).toBe(true);
    expect(await listBatches(db, me)).toEqual([]);
    expect((await restoreBatch(db, me, b.value.id)).ok).toBe(true);
    expect(await listBatches(db, me)).toHaveLength(1);
  });

  it("refuses zero portions", async () => {
    expect(
      await cookBatch(db, me, {
        mealId,
        portions: 0,
        day: "2026-10-05",
        cookedAt: cooked,
      }),
    ).toEqual({
      ok: false,
      errors: { portions: "not_positive" },
    });
  });
});
