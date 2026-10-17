import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { loadDay } from "../day";
import { checkEntry, createEntry, readEntry, updateEntry } from "../entries";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { kindRegistry } from "../kinds";
import { readFoodChoices, readRecipeChoices } from "./catalog";
import {
  foodChoices,
  lineChoices,
  recipeChoices,
  searchFoods,
  searchRecipes,
  type FoodChoice,
} from "./choices";
import { checkMealLines } from "./meal";
import { createRecipe, recipeName, recipeNameTaken } from "./recipes";

const items = [
  { id: "f1", catalog: "food", name: "Caffè", parentId: null },
  { id: "f2", catalog: "food", name: "Avena", parentId: null },
  { id: "p1", catalog: "product", name: "Granarolo", parentId: "f2" },
  { id: "x", catalog: "exercise", name: "Panca", parentId: null },
];
const values = [
  { itemId: "f2", field: "kcal", num: "372", text: null },
  { itemId: "f2", field: "protein", num: "13.5", text: null },
  { itemId: "f2", field: "description", num: null, text: "fiocchi" },
  { itemId: "p1", field: "protein", num: "14", text: null },
  { itemId: "f1", field: "unit", num: null, text: "ml" },
  { itemId: "f1", field: "kcal", num: "2", text: null },
];

describe("the composer's choices", () => {
  const choices = foodChoices(items, values, [
    { itemId: "f2", productId: "p1", uses: 5, lastQty: "60.000" },
    { itemId: "f1", productId: null, uses: 9, lastQty: "100.000" },
  ]);

  it("are foods by name, each with its products; a product's label on top of its food", () => {
    expect(choices.map((c) => [c.key, c.brand, c.unit])).toEqual([
      ["f2", null, "g"],
      ["f2:p1", "Granarolo", "g"],
      ["f1", null, "ml"],
    ]);
    expect(choices[0]!.per100).toEqual({ kcal: "372", protein: "13.5" });
    expect(choices[1]!.per100).toEqual({ kcal: "372", protein: "14" });
    expect(choices[1]).toMatchObject({ uses: 5, lastQty: "60.000" });
  });

  it("are searched without accents, every word, most eaten first", () => {
    expect(searchFoods(choices, "caffe").map((c) => c.key)).toEqual(["f1"]);
    expect(searchFoods(choices, "avena gran").map((c) => c.key)).toEqual(["f2:p1"]);
    expect(searchFoods(choices, "").map((c) => c.key)).toEqual(["f1", "f2:p1"]);
    expect(searchFoods(choices, "a").map((c) => c.key)).toEqual(["f1", "f2:p1", "f2"]);
  });

  it("make lines only from known choices and real quantities", () => {
    const by = new Map(choices.map((c) => [c.key, c]));
    expect(checkMealLines([{ key: "f2:p1", quantity: "60,5" }], by)).toEqual({
      ok: true,
      lines: [
        {
          itemId: "f2",
          productId: "p1",
          name: "Avena",
          quantity: "60.5",
          unit: "g",
          per100: { kcal: "372", protein: "14" },
        },
      ],
    });
    expect(checkMealLines([], by)).toEqual({ ok: false, lines: "empty", at: {} });
    expect(
      checkMealLines(
        [
          { key: "nope", quantity: "10" },
          { key: "f1", quantity: "0" },
          { key: "f1", quantity: "6000" },
          { key: "f1", quantity: "1,234" },
        ],
        by,
      ),
    ).toEqual({
      ok: false,
      at: { 0: "unknown", 1: "quantity", 2: "too_much", 3: "quantity" },
    });
  });
});

describe("saved meals", () => {
  const foods = foodChoices(items, values, []);
  const part = (
    position: number,
    partItemId: string,
    quantity: string | null,
    defaults = {},
  ) => ({
    itemId: "r1",
    position,
    partItemId,
    quantity,
    defaults,
  });
  const recipes = recipeChoices(
    [
      { id: "r1", name: "Colazione d’avena" },
      { id: "r2", name: "Vuota" },
    ],
    [
      part(1, "f1", "100"),
      part(0, "f2", "60.00", { preferredProduct: "p1" }),
      part(2, "gone", "10"),
      part(3, "f2", null),
    ],
    new Map([["r1", 4]]),
    foods,
  );

  it("are recipes with their parts as choices, the preferred product when it is one", () => {
    expect(recipes).toEqual([
      {
        key: "recipe:r1",
        recipeId: "r1",
        name: "Colazione d’avena",
        parts: [
          { key: "f2:p1", quantity: "60.00" },
          { key: "f1", quantity: "100" },
        ],
        uses: 4,
      },
    ]);
  });

  it("are searched by name, most used first", () => {
    expect(searchRecipes(recipes, "colazione avena").map((r) => r.recipeId)).toEqual([
      "r1",
    ]);
    expect(searchRecipes(recipes, "")).toHaveLength(1);
    expect(searchRecipes(recipes, "pranzo")).toEqual([]);
  });
});

describe("a recipe's name", () => {
  it("is trimmed, not empty and not too long", () => {
    expect(recipeName("  Porridge   alla  cannella ")).toEqual({
      ok: true,
      name: "Porridge alla cannella",
    });
    expect(recipeName("  ")).toEqual({ ok: false, error: "empty" });
    expect(recipeName("x".repeat(81))).toEqual({ ok: false, error: "too_long" });
  });
});

describe("a meal from the catalog", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  let oats: string;

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    [{ id: oats }] = (await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "food", name: "Avena" })
      .returning({ id: s.catalogItems.id })) as [{ id: string }];
    await db.insert(s.catalogValues).values([
      { userId: a.id, itemId: oats, field: "kcal", num: "372" },
      { userId: a.id, itemId: oats, field: "protein", num: "13.5" },
    ]);
  });
  afterAll(() => close());

  const asChecked = async (day: string) => {
    const e = checkEntry(
      kindRegistry().get("meal"),
      { day, status: "done", startMin: 8 * 60, endMin: null, values: {}, note: "" },
      { timeZone: "Europe/Rome", boundaryMin: 240 },
    );
    if (!e.ok) throw new Error("expected a valid meal");
    return e.entry;
  };

  const logMeal = async (owner: Owner, choices: FoodChoice[], quantity: string) => {
    const lines = checkMealLines(
      [{ key: choices[0]!.key, quantity }],
      new Map(choices.map((c) => [c.key, c])),
    );
    const entry = checkEntry(
      kindRegistry().get("meal"),
      {
        day: "2026-10-15",
        status: "done",
        startMin: 8 * 60,
        endMin: null,
        values: { role: "breakfast" },
        note: "",
      },
      { timeZone: "Europe/Rome", boundaryMin: 240 },
    );
    if (!lines.ok || !entry.ok) throw new Error("expected a valid meal");
    return createEntry(db, owner, { ...entry.entry, lines: lines.lines });
  };

  it("writes the lines with their snapshot, and the catalog's later edits leave it", async () => {
    const choices = await readFoodChoices(db, a, "2026-10-17");
    expect(choices.map((c) => [c.name, c.uses])).toEqual([["Avena", 0]]);
    const id = await logMeal(a, choices, "80");
    await db
      .update(s.catalogValues)
      .set({ num: "400" })
      .where(and(eq(s.catalogValues.itemId, oats), eq(s.catalogValues.field, "kcal")));
    const meal = (await loadDay(db, a, "2026-10-15")).timed.find((i) => i.id === id)!;
    expect(meal.subcategory).toBe("breakfast");
    expect(meal.lines).toMatchObject([
      {
        name: "Avena",
        quantity: "80.00",
        values: { kcal: "372.0000", protein: "13.5000" },
      },
    ]);
    const again = await readFoodChoices(db, a, "2026-10-17");
    expect(again[0]).toMatchObject({ uses: 1, per100: { kcal: "400.0000" } });
    expect(Number(again[0]!.lastQty)).toBe(80);
  });

  it("never offers or logs another person's foods", async () => {
    expect(await readFoodChoices(db, b, "2026-10-17")).toEqual([]);
    const theirs = await readFoodChoices(db, a, "2026-10-17");
    expect(checkMealLines([{ key: theirs[0]!.key, quantity: "80" }], new Map())).toEqual({
      ok: false,
      at: { 0: "unknown" },
    });
  });

  it("edits a meal: an old line keeps its snapshot, a new one takes today's values", async () => {
    const choices = await readFoodChoices(db, a, "2026-10-17");
    const id = await logMeal(a, choices, "50");
    await db
      .update(s.catalogValues)
      .set({ num: "500" })
      .where(and(eq(s.catalogValues.itemId, oats), eq(s.catalogValues.field, "kcal")));
    const logged = (await readEntry(db, a, id))!;
    const old = lineChoices(logged.lines);
    const now = await readFoodChoices(db, a, "2026-10-17");
    const lines = checkMealLines(
      [
        { key: old[0]!.key, quantity: "70" },
        { key: now[0]!.key, quantity: "10" },
      ],
      new Map([...old, ...now].map((c) => [c.key, c])),
    );
    const entry = checkEntry(
      kindRegistry().get("meal"),
      {
        day: "2026-10-15",
        status: "done",
        startMin: 9 * 60,
        endMin: null,
        values: { role: "" },
        note: "",
      },
      { timeZone: "Europe/Rome", boundaryMin: 240 },
    );
    if (!lines.ok || !entry.ok) throw new Error("expected a valid edit");
    expect(
      await updateEntry(db, a, id, { ...entry.entry, lines: lines.lines }, ["role"]),
    ).toBe(true);
    const edited = (await readEntry(db, a, id))!;
    expect(edited.values["role"]).toBeUndefined();
    expect(edited.subcategory).toBe("breakfast");
    expect(edited.lines.map((l) => [l.quantity, l.values["kcal"], l.itemId])).toEqual([
      // logged when the catalog said 400 (the test before): kept after it became 500
      ["70.00", "400.0000", oats],
      ["10.00", "500.0000", oats],
    ]);
  });

  it("reads the owner's recipes, and a meal logged from one is of it", async () => {
    const [{ id: recipe }] = (await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "recipe", name: "Porridge" })
      .returning({ id: s.catalogItems.id })) as [{ id: string }];
    await db.insert(s.catalogParts).values({
      userId: a.id,
      itemId: recipe,
      position: 0,
      partItemId: oats,
      quantity: "60",
    });
    const foods = await readFoodChoices(db, a, "2026-10-17");
    const recipes = await readRecipeChoices(db, a, "2026-10-17", foods);
    expect(recipes).toMatchObject([
      { name: "Porridge", parts: [{ key: oats, quantity: "60.00" }], uses: 0 },
    ]);
    expect(await readRecipeChoices(db, b, "2026-10-17", [])).toEqual([]);
    const id = await logMeal(a, foods, "60");
    const meal = (await readEntry(db, a, id))!;
    expect(
      await updateEntry(
        db,
        a,
        id,
        { ...(await asChecked(meal.day)), itemId: recipe },
        [],
      ),
    ).toBe(true);
    expect((await readEntry(db, a, id))!.item).toMatchObject({
      id: recipe,
      name: "Porridge",
    });
    expect((await readRecipeChoices(db, a, "2026-10-17", foods))[0]!.uses).toBe(1);
  });

  it("saves a composed meal as a recipe the composer then offers", async () => {
    const foods = await readFoodChoices(db, a, "2026-10-17");
    const lines = checkMealLines(
      [{ key: foods[0]!.key, quantity: "45" }],
      new Map(foods.map((c) => [c.key, c])),
    );
    if (!lines.ok) throw new Error("expected valid lines");
    const unknown = { ...lines.lines[0]!, itemId: null, name: "vecchio" };
    const id = await createRecipe(db, a, "Avena del mattino", [...lines.lines, unknown]);
    const recipes = await readRecipeChoices(db, a, "2026-10-17", foods);
    expect(recipes.find((r) => r.recipeId === id)).toMatchObject({
      name: "Avena del mattino",
      parts: [{ key: foods[0]!.key, quantity: "45.00" }],
    });
    expect(await recipeNameTaken(db, a, "AVENA DEL MATTINO")).toBe(true);
    expect(await recipeNameTaken(db, a, "Avena della sera")).toBe(false);
    expect(await recipeNameTaken(db, b, "Avena del mattino")).toBe(false);
  });
});
