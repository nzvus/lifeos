import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { loadDay } from "../day";
import { checkEntry, createEntry, readEntry, updateEntry } from "../entries";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { kindRegistry } from "../kinds";
import { readFoodChoices } from "./catalog";
import { foodChoices, lineChoices, searchFoods, type FoodChoice } from "./choices";
import { checkMealLines } from "./meal";

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
});
