import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readFoodChoices, readRecipeChoices, savedEstimates } from "./catalog";
import {
  archiveRecipe,
  createEstimateRecipe,
  createRecipe,
  duplicateRecipe,
  readRecipe,
  updateRecipe,
} from "./recipes";

describe("a saved meal's editor", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  let id: string;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    const foods = (await db
      .insert(s.catalogItems)
      .values([
        { userId: a.id, catalog: "food", name: "Avena" },
        { userId: a.id, catalog: "food", name: "Latte" },
      ])
      .returning({ id: s.catalogItems.id })) as { id: string }[];
    const line = (itemId: string, name: string, quantity: string) => ({
      itemId,
      productId: null,
      name,
      quantity,
      unit: "g",
      per100: {},
    });
    id = await createRecipe(db, a, "Porridge", [
      line(foods[0]!.id, "Avena", "50"),
      line(foods[1]!.id, "Latte", "200"),
    ]);
    await createRecipe(db, a, "Pancake", [line(foods[0]!.id, "Avena", "40")]);
  });
  afterAll(() => close());

  it("renames, keeps the parts named at their quantities, refuses a taken name", async () => {
    expect(
      await updateRecipe(db, a, id, "pancake", [{ position: 0, quantity: "60" }]),
    ).toBe("taken");
    expect(await updateRecipe(db, b, id, "X", [{ position: 0, quantity: "60" }])).toBe(
      "gone",
    );
    expect(await updateRecipe(db, a, id, "X", [])).toBe("empty");
    expect(
      await updateRecipe(db, a, id, "Porridge salato", [
        { position: 1, quantity: "250" },
      ]),
    ).toBe("ok");
    expect(await readRecipe(db, a, id)).toEqual({
      name: "Porridge salato",
      parts: [{ position: 0, name: "Latte", quantity: "250.00", unit: "g" }],
    });
  });

  it("duplicates it with its parts under the first free name", async () => {
    const one = await duplicateRecipe(db, a, id);
    const two = await duplicateRecipe(db, a, id);
    expect((await readRecipe(db, a, one!))?.name).toBe("Porridge salato (copia)");
    expect(await readRecipe(db, a, two!)).toMatchObject({
      name: "Porridge salato (copia 2)",
      parts: [{ name: "Latte", quantity: "250.00" }],
    });
    expect(await duplicateRecipe(db, b, id)).toBeNull();
  });

  it("archives it out of reach", async () => {
    expect(await archiveRecipe(db, b, id)).toBe(false);
    expect(await archiveRecipe(db, a, id)).toBe(true);
    expect(await readRecipe(db, a, id)).toBeNull();
  });
});

describe("a saved estimate (a meal out kept in the library)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
  });
  afterAll(() => close());

  it("is a saved meal with its typed totals and no foods, the owner's only", async () => {
    const id = await createEstimateRecipe(db, a, "Menu hamburger", {
      kcal: "1250",
      protein: "45",
      fat: "60",
    });
    const foods = await readFoodChoices(db, a, "2026-10-23");
    const mine = await readRecipeChoices(db, a, "2026-10-23", foods);
    expect(mine).toEqual([
      {
        key: "recipe:" + id,
        recipeId: id,
        name: "Menu hamburger",
        parts: [],
        uses: 0,
        estimate: { kcal: "1250.0000", protein: "45.0000", fat: "60.0000" },
      },
    ]);
    expect(await readRecipeChoices(db, b, "2026-10-23", [])).toEqual([]);
  });

  it("needs the mark: values on a recipe without it are no estimate", () => {
    const rows = [
      { itemId: "x", field: "kcal", num: "900", bool: null },
      { itemId: "y", field: "estimate", num: null, bool: true },
      { itemId: "y", field: "kcal", num: "700", bool: null },
    ];
    expect([...savedEstimates(rows)]).toEqual([["y", { kcal: "700" }]]);
  });
});
