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
  readRecipe,
  replaceRecipe,
} from "./recipes";
import { eq } from "drizzle-orm";

describe("a saved meal, made and changed in the composer (FOOD-42)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  let id: string;
  let foods: string[];
  const line = (itemId: string, name: string, quantity: string) => ({
    itemId,
    productId: null,
    name,
    quantity,
    unit: "g",
    per100: {},
  });
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    foods = (
      (await db
        .insert(s.catalogItems)
        .values([
          { userId: a.id, catalog: "food", name: "Avena" },
          { userId: a.id, catalog: "food", name: "Latte" },
        ])
        .returning({ id: s.catalogItems.id })) as { id: string }[]
    ).map((f) => f.id);
    id = await createRecipe(db, a, "Porridge", [
      line(foods[0]!, "Avena", "50"),
      line(foods[1]!, "Latte", "200"),
    ]);
    await createRecipe(db, a, "Pancake", [line(foods[0]!, "Avena", "40")]);
  });
  afterAll(() => close());

  it("is written again from the composer: name, foods with their product; a taken name refused", async () => {
    const [avena, latte] = foods;
    const checked = (lines: ReturnType<typeof line>[]) => ({ lines, estimate: false });
    expect(
      await replaceRecipe(db, a, id, "pancake", checked([line(avena!, "Avena", "60")])),
    ).toBe("taken");
    expect(
      await replaceRecipe(db, b, id, "X", checked([line(avena!, "Avena", "60")])),
    ).toBe("gone");
    expect(await replaceRecipe(db, a, id, "X", checked([]))).toBe("empty");
    expect(
      await replaceRecipe(
        db,
        a,
        id,
        "Porridge salato",
        checked([line(latte!, "Latte", "250"), line(avena!, "Avena", "30")]),
      ),
    ).toBe("ok");
    expect(await readRecipe(db, a, id)).toEqual({
      name: "Porridge salato",
      parts: [
        { position: 0, name: "Latte", quantity: "250.00", unit: "g" },
        { position: 1, name: "Avena", quantity: "30.00", unit: "g" },
      ],
    });
  });

  it("turns into a saved estimate and back, never keeping the other's values", async () => {
    const est = {
      itemId: null,
      productId: null,
      name: "Porridge fuori",
      quantity: "100",
      unit: "g",
      per100: { kcal: "500", salt: "1" },
    };
    expect(
      await replaceRecipe(db, a, id, "Porridge salato", { lines: [est], estimate: true }),
    ).toBe("ok");
    const read = async () =>
      (
        await readRecipeChoices(
          db,
          a,
          "2026-10-23",
          await readFoodChoices(db, a, "2026-10-23"),
        )
      ).find((r) => r.recipeId === id);
    expect(await read()).toMatchObject({
      parts: [],
      estimate: { kcal: "500.0000", salt: "1.0000" },
    });
    await replaceRecipe(db, a, id, "Porridge salato", {
      lines: [line(foods[0]!, "Avena", "50")],
      estimate: false,
    });
    expect((await read())?.estimate).toBeUndefined();
  });

  it("«Parti da…»: a new meal remembers the one it started from", async () => {
    const copy = await createRecipe(
      db,
      a,
      "Porridge proteico",
      [line(foods[0]!, "Avena", "50")],
      id,
    );
    const [row] = await db
      .select({ basedOnId: s.catalogItems.basedOnId })
      .from(s.catalogItems)
      .where(eq(s.catalogItems.id, copy));
    expect(row?.basedOnId).toBe(id);
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
