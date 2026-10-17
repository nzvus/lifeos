import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { checkFood, createFood, updateFood, valueChanges } from "./edit";
import { readFoodChoices } from "./catalog";

describe("a food's editor", () => {
  it("checks the name and the values per 100", () => {
    expect(checkFood(" Avena ", { kcal: "372", protein: "13,5", fat: "" })).toEqual({
      ok: true,
      name: "Avena",
      values: { kcal: "372", protein: "13.5" },
    });
    expect(checkFood("", { kcal: "1000", nova: "5", salt: "x" })).toEqual({
      ok: false,
      name: "empty",
      at: { kcal: "too_much", nova: "nova", salt: "number" },
    });
  });

  it("changes only what differs", () => {
    expect(
      valueChanges(
        { kcal: "372.0000", protein: "13.5", fat: "7" },
        { kcal: "372", protein: "14" },
      ),
    ).toEqual({ set: [["protein", "14"]], remove: ["fat"] });
  });

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
      .values([
        { userId: a.id, catalog: "food", name: "Avena" },
        { userId: a.id, catalog: "food", name: "Riso" },
      ])
      .returning({ id: s.catalogItems.id })) as [{ id: string }];
    await db.insert(s.catalogValues).values([
      { userId: a.id, itemId: oats, field: "kcal", num: "372", source: "CIQUAL" },
      { userId: a.id, itemId: oats, field: "fat", num: "7", source: "CIQUAL" },
    ]);
  });
  afterAll(() => close());

  it("writes the changed values as typed, keeps the others' source, refuses a taken name", async () => {
    expect(await updateFood(db, a, oats, "riso", {})).toBe("taken");
    expect(await updateFood(db, b, oats, "Avena", {})).toBe("gone");
    expect(
      await updateFood(db, a, oats, "Fiocchi d'avena", { kcal: "372", protein: "13.5" }),
    ).toBe("ok");
    const rows = await db
      .select({
        field: s.catalogValues.field,
        num: s.catalogValues.num,
        source: s.catalogValues.source,
      })
      .from(s.catalogValues)
      .where(and(eq(s.catalogValues.itemId, oats)));
    expect(rows.sort((x, y) => x.field.localeCompare(y.field))).toEqual([
      { field: "kcal", num: "372.0000", source: "CIQUAL" },
      { field: "protein", num: "13.5000", source: "typed" },
    ]);
  });

  it("creates a food with its unit and values, unless the name is taken", async () => {
    expect(await createFood(db, a, "RISO", "g", {})).toBe("taken");
    const made = await createFood(db, a, "Kefir", "ml", { kcal: "41", protein: "3.5" });
    const choices = await readFoodChoices(db, a, "2026-10-17");
    const k = choices.find((c) => typeof made === "object" && c.foodId === made.id);
    expect(k).toMatchObject({
      name: "Kefir",
      unit: "ml",
      per100: { kcal: "41.0000", protein: "3.5000" },
    });
  });
});
