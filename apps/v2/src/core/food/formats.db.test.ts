import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readFoodChoices, readFoodFormats } from "./catalog";

// objects.md §8 test 4: his Gnocchi Nonna Mia, two formats, two prices per kg.
describe("a food's formats and their price per kg (ADR-0055, ADR-0060)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let food: string;
  const item = async (catalog: string, name: string, parentId: string | null) =>
    (
      (await db
        .insert(s.catalogItems)
        .values({ userId: a.id, catalog, name, parentId })
        .returning({ id: s.catalogItems.id })) as [{ id: string }]
    )[0].id;

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    food = await item("food", "Gnocchi di patate", null);
    const brand = await item("product", "Nonna Mia", food);
    const big = await item("format", "gnocchi", brand);
    const small = await item("format", "gnocchetti", brand);
    await db.insert(s.catalogValues).values([
      { userId: a.id, itemId: food, field: "kcal", num: "150" },
      { userId: a.id, itemId: big, field: "size", num: "1000" },
      { userId: a.id, itemId: small, field: "size", num: "500" },
    ]);
    await db.insert(s.priceObservations).values([
      {
        userId: a.id,
        formatId: big,
        day: "2026-10-20",
        cents: 100,
        packageQty: "1000",
        unit: "g",
        source: "manual",
      },
      {
        userId: a.id,
        formatId: small,
        day: "2026-10-20",
        cents: 80,
        packageQty: "500",
        unit: "g",
        source: "manual",
      },
    ]);
  });
  afterAll(() => close());

  it("each format at its own €/kg, the brand at their median, the food at its brand", async () => {
    const formats = await readFoodFormats(db, a, food, "2026-11-03");
    expect(
      formats.map((f) => [f.name, Number(f.size), Number(f.centsPer100) / 10]),
    ).toEqual(
      expect.arrayContaining([
        ["gnocchi", 1000, 1],
        ["gnocchetti", 500, 1.6],
      ]),
    );
    const choices = await readFoodChoices(db, a, "2026-11-03");
    const brand = choices.find((c) => c.brand === "Nonna Mia")!;
    expect(Number(brand.per100["cents"]) / 10).toBe(1.3);
    const generic = choices.find((c) => c.key === food)!;
    expect(Number(generic.per100["cents"]) / 10).toBe(1.3);
    expect(generic.per100["kcal"]).toBe("150.0000");
  });
});
