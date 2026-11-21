// MOD-23, ADR-0065: a pasto holding another pasto as a line offers that pasto's foods × k.
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readFoodChoices, readRecipeChoices } from "./catalog";

let db: Db;
let close: () => Promise<void>;
let a: Owner;

beforeAll(async () => {
  const t = await createTestDb();
  db = t.db as unknown as Db;
  close = t.close;
  a = ownerFromVerifiedSession(await createTestUser(t.db, "kin@example.test"));
});
afterAll(() => close());

const item = async (catalog: string, name: string) =>
  (
    (await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog, name })
      .returning({ id: s.catalogItems.id })) as [{ id: string }]
  )[0].id;
const part = (itemId: string, position: number, partItemId: string, quantity: string) =>
  db
    .insert(s.catalogParts)
    .values({ userId: a.id, itemId, position, partItemId, quantity });

it("a parent line counts as the parent's foods × its multiplier; nothing is dropped", async () => {
  const milk = await item("food", "Latte");
  const whey = await item("food", "Whey");
  const nut = await item("food", "Nocciole");
  const gelato = await item("recipe", "Gelato");
  await part(gelato, 0, milk, "400");
  await part(gelato, 1, whey, "15");
  const doppio = await item("recipe", "Gelato doppio alle nocciole");
  await part(doppio, 0, gelato, "2");
  await part(doppio, 1, nut, "20");

  const foods = await readFoodChoices(db, a, "2026-11-21");
  const recipes = await readRecipeChoices(db, a, "2026-11-21", foods);
  const of = (name: string) =>
    recipes.find((r) => r.name === name)?.parts.map((p) => [p.key, Number(p.quantity)]);
  expect(of("Gelato")).toEqual([
    [milk, 400],
    [whey, 15],
  ]);
  expect(of("Gelato doppio alle nocciole")).toEqual([
    [milk, 800],
    [whey, 30],
    [nut, 20],
  ]);
});

it("kin written (MOD-23): a parent added, its k stepped, a child copied; never a loop", async () => {
  const { addChild, addParent, setParentK } = await import("./kin");
  const egg = await item("food", "Uovo");
  const salt = await item("food", "Sale");
  const base = await item("recipe", "Frittata");
  await part(base, 0, egg, "120");
  await part(base, 1, salt, "1");
  const dish = await item("recipe", "Frittata e pane");
  await part(dish, 0, egg, "10");

  expect(await addParent(db, a, dish, base)).toBe(true);
  expect(await addParent(db, a, dish, base)).toBe(false); // already there
  expect(await addParent(db, a, base, dish)).toBe(false); // a loop
  expect(await addParent(db, a, dish, dish)).toBe(false);
  expect(await setParentK(db, a, dish, base, 1.5)).toBe(true);
  expect(await setParentK(db, a, dish, base, 0)).toBe(false);

  const foods = await readFoodChoices(db, a, "2026-11-21");
  const recipes = await readRecipeChoices(db, a, "2026-11-21", foods);
  const d = recipes.find((r) => r.recipeId === dish)!;
  expect(d.parents).toEqual([{ id: base, k: 1.5 }]);
  expect(d.parts.map((p) => [p.key, Number(p.quantity)])).toEqual([
    [egg, 190],
    [salt, 1.5],
  ]);

  const child = await addChild(db, a, base);
  const again = await addChild(db, a, base);
  const after = await readRecipeChoices(db, a, "2026-11-21", foods);
  expect(after.find((r) => r.recipeId === child)?.name).toBe("Frittata (2)");
  expect(after.find((r) => r.recipeId === again)?.name).toBe("Frittata (3)");
  expect(after.find((r) => r.recipeId === child)?.parents).toEqual([{ id: base, k: 1 }]);
});
