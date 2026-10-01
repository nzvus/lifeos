/**
 * Tests for the pantry repositories (ADR-0013/0017): products and their
 * ingredient link, purchases, counts, the derived stock and the shopping
 * list — on PGlite with the real migrations.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import { batches, batchLines, logEntries } from "../../db/schema";
import type { Owner } from "../../identity/owner";
import { createIngredient } from "../../nutrition/repositories/ingredients";
import { logIngredient } from "../../nutrition/repositories/log";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import type { ProductInput } from "../validation";
import {
  addCount,
  addPurchase,
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  listPurchases,
  restoreProduct,
} from "./products";
import { getPantry, shoppingList } from "./stock";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;
let oatsId: string;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
  const oats = await createIngredient(db, me, ingredientFixture()); // Oats, g
  if (!oats.ok) throw new Error("setup failed");
  oatsId = oats.value.id;
});
afterEach(() => close());

const NOW = new Date("2026-10-20T20:00:00Z");
const product = (v: Partial<ProductInput> = {}): ProductInput => ({
  name: "Fiocchi d'avena 500 g",
  brand: "",
  unit: "g",
  packageSize: "500",
  ingredientId: null,
  shop: "",
  notes: "",
  ...v,
});
async function make(v: Partial<ProductInput> = {}, owner = me) {
  const r = await createProduct(db, owner, product(v));
  if (!r.ok) throw new Error("setup failed: " + JSON.stringify(r.errors));
  return r.value.id;
}

describe("products", () => {
  it("link only to my live ingredient in the same unit", async () => {
    const id = await make({ ingredientId: oatsId });
    expect((await getProduct(db, me, id))?.ingredientName).toBe("Oats");
    // Wrong unit, someone else's ingredient: refused before the database.
    expect(
      await createProduct(
        db,
        me,
        product({ name: "X", unit: "ml", ingredientId: oatsId }),
      ),
    ).toEqual({
      ok: false,
      errors: { ingredientId: "invalid_choice" },
    });
    expect(await createProduct(db, other, product({ ingredientId: oatsId }))).toEqual({
      ok: false,
      errors: { ingredientId: "not_found" },
    });
    // CROSS-USER: none of mine in their list.
    expect(await listProducts(db, other)).toEqual([]);
  });

  it("go to the trash and come back; a name stays unique among live ones", async () => {
    const id = await make();
    expect(await createProduct(db, me, product())).toEqual({
      ok: false,
      errors: { name: "duplicate_name" },
    });
    expect((await deleteProduct(db, me, id)).ok).toBe(true);
    expect(await listProducts(db, me)).toEqual([]);
    expect((await restoreProduct(db, other, id)).ok).toBe(false);
    expect((await restoreProduct(db, me, id)).ok).toBe(true);
  });

  it("purchases keep their price history; nobody can buy my product", async () => {
    const id = await make();
    await addPurchase(db, me, {
      productId: id,
      day: "2026-10-01",
      packages: "2",
      priceCents: 398,
      shop: "Lidl",
    });
    await addPurchase(db, me, {
      productId: id,
      day: "2026-10-10",
      packages: "1",
      priceCents: 209,
      shop: "",
    });
    expect((await listPurchases(db, me, id)).map((p) => [p.day, p.priceCents])).toEqual([
      ["2026-10-10", 209],
      ["2026-10-01", 398],
    ]);
    expect(
      await addPurchase(db, other, {
        productId: id,
        day: "2026-10-01",
        packages: "1",
        priceCents: null,
        shop: "",
      }),
    ).toEqual({ ok: false, errors: { productId: "not_found" } });
  });
});

describe("the pantry (derived stock)", () => {
  it("food: bought − eaten − cooked, a count resets it; plans and portions don't count", async () => {
    const p = await make({ ingredientId: oatsId });
    await addPurchase(db, me, {
      productId: p,
      day: "2026-10-01",
      packages: "2",
      priceCents: null,
      shop: "",
    }); // +1000
    await logIngredient(db, me, {
      day: "2026-10-02",
      ingredientId: oatsId,
      quantity: "60",
    }); // −60 eaten
    await logIngredient(db, me, {
      day: "2026-10-03",
      ingredientId: oatsId,
      quantity: "999",
      status: "planned",
    }); // planned: not taken
    // A batch cooked on the 5th used 200 g; a portion of it eaten later
    // must not take the oats again.
    const [b] = await db
      .insert(batches)
      .values({
        userId: me.id,
        label: "Porridge ×4",
        portions: 4,
        cookedAt: new Date("2026-10-05T08:00:00Z"),
        day: "2026-10-05",
      })
      .returning();
    const fixture = ingredientFixture();
    await db.insert(batchLines).values({
      userId: me.id,
      batchId: b!.id,
      ingredientId: oatsId,
      name: "Oats",
      unit: "g",
      quantity: "200",
      kcal: fixture.kcal,
      protein: fixture.protein,
      carbs: fixture.carbs,
      sugars: fixture.sugars,
      fat: fixture.fat,
      saturatedFat: fixture.saturatedFat,
      fiber: fixture.fiber,
      salt: fixture.salt,
      position: 0,
    });
    await db
      .insert(logEntries)
      .values({ userId: me.id, day: "2026-10-06", label: "Porridge", batchId: b!.id });

    const [oats] = await getPantry(db, me, NOW);
    expect(oats).toMatchObject({ kind: "ingredient", name: "Oats", quantity: "740" });
    // 260 g used in the last 30 days → 8.667 g/day → 85 days left.
    expect(oats?.dailyUse).toBe("8.667");
    expect(oats?.daysLeft).toBe(85);

    await addCount(
      db,
      me,
      { ingredientId: oatsId, productId: null, quantity: "100" },
      NOW,
    );
    expect((await getPantry(db, me, new Date(NOW.getTime() + 1000)))[0]?.quantity).toBe(
      "100",
    );
    // CROSS-USER: my pantry is not theirs.
    expect(await getPantry(db, other, NOW)).toEqual([]);
  });

  it("other products are counted on themselves, in pieces", async () => {
    const paper = await make({
      name: "Carta igienica ×8",
      unit: "piece",
      packageSize: "8",
    });
    await addPurchase(db, me, {
      productId: paper,
      day: "2026-10-01",
      packages: "1",
      priceCents: 350,
      shop: "",
    });
    await addCount(db, me, { ingredientId: null, productId: paper, quantity: "0" }, NOW);
    const later = new Date(NOW.getTime() + 1000);
    const pantry = await getPantry(db, me, later);
    expect(pantry.map((i) => [i.kind, i.name, i.unit, i.quantity])).toEqual([
      ["product", "Carta igienica ×8", "piece", "0"],
    ]);
    // Gone → on the shopping list.
    expect(shoppingList(pantry).map((i) => i.name)).toEqual(["Carta igienica ×8"]);
  });

  it("a product in the trash leaves the pantry", async () => {
    const p = await make({ ingredientId: oatsId });
    await addPurchase(db, me, {
      productId: p,
      day: "2026-10-01",
      packages: "1",
      priceCents: null,
      shop: "",
    });
    await deleteProduct(db, me, p);
    expect(await getPantry(db, me, NOW)).toEqual([]);
  });
});
