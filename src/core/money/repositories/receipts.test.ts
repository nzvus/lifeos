/** A reviewed receipt saved (ADR-0036): ledger, pantry, aliases, prices. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import {
  createIngredient,
  getIngredient,
} from "../../nutrition/repositories/ingredients";
import { createProduct, listPurchases } from "../../pantry/repositories/products";
import { parseInput } from "../../shared/validation";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import { receiptInput } from "../validation";
import { ensureCategories, listMovements } from "./money";
import { listReceipts, movementLines, receiptAliasMap, saveReceipt } from "./receipts";

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

async function oatsProduct(who: Owner) {
  const ing = await createIngredient(db, who, ingredientFixture());
  if (!ing.ok) throw new Error("setup failed");
  const p = await createProduct(db, who, {
    name: "Avena 500 g",
    brand: "",
    unit: "g",
    packageSize: "500",
    ingredientId: ing.value.id,
    shop: "",
    notes: "",
  });
  if (!p.ok) throw new Error("setup failed");
  return { ingredientId: ing.value.id, productId: p.value.id };
}

const input = (lines: unknown[], extra: Record<string, string> = {}) => {
  const r = parseInput(receiptInput, {
    day: "2026-10-04",
    shop: "Esselunga",
    text: "AVENA 2,40\nCARTA IGIENICA 3,49",
    lines: JSON.stringify(lines),
    ...extra,
  });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
};

describe("saveReceipt", () => {
  it("makes one movement with its lines, a pantry purchase, an alias and the new price", async () => {
    const { ingredientId, productId } = await oatsProduct(me);
    const cats = await ensureCategories(db, me, "it");
    const groceries = cats.find((c) => c.key === "groceries")!;
    const r = await saveReceipt(
      db,
      me,
      input(
        [
          {
            description: "AVENA",
            quantity: "2",
            amountCents: 240,
            productId,
            toPantry: true,
          },
          {
            description: "CARTA IGIENICA",
            quantity: null,
            amountCents: 349,
            productId: null,
            toPantry: false,
          },
        ],
        { categoryId: groceries.id, method: "card" },
      ),
    );
    if (!r.ok) throw new Error(JSON.stringify(r.errors));

    const [m] = await listMovements(db, me, "2026-10-01", "2026-10-31");
    expect(m).toMatchObject({
      amountCents: -589,
      categoryId: groceries.id,
      shop: "Esselunga",
      method: "card",
    });
    expect(await movementLines(db, me, m!.id)).toEqual([
      {
        description: "AVENA",
        quantity: "2.000",
        amountCents: 240,
        productName: "Avena 500 g",
        inPantry: true,
      },
      {
        description: "CARTA IGIENICA",
        quantity: null,
        amountCents: 349,
        productName: null,
        inPantry: false,
      },
    ]);
    // Two packages bought at 2,40: stock and price follow.
    const [purchase] = await listPurchases(db, me, productId);
    expect(purchase).toMatchObject({ packages: "2.00", priceCents: 240 });
    expect(await getIngredient(db, me, ingredientId)).toMatchObject({
      packagePriceCents: 120,
      packageSize: "500.00",
    });
    expect(await receiptAliasMap(db, me)).toEqual({ avena: productId });
    expect(await listReceipts(db, me)).toMatchObject([
      { shop: "Esselunga", totalCents: 589, lines: 2, movementId: m!.id },
    ]);
    expect(await listReceipts(db, other)).toEqual([]);
  });

  it("refuses someone else's product or category, and an empty receipt", async () => {
    const theirs = await oatsProduct(other);
    expect(
      await saveReceipt(
        db,
        me,
        input([
          {
            description: "X",
            quantity: null,
            amountCents: 100,
            productId: theirs.productId,
            toPantry: true,
          },
        ]),
      ),
    ).toEqual({ ok: false, errors: { lines: "not_found" } });
    const theirCats = await ensureCategories(db, other, "it");
    expect(
      (
        await saveReceipt(
          db,
          me,
          input(
            [
              {
                description: "X",
                quantity: null,
                amountCents: 100,
                productId: null,
                toPantry: false,
              },
            ],
            {
              categoryId: theirCats[0]!.id,
            },
          ),
        )
      ).ok,
    ).toBe(false);
    expect(
      await saveReceipt(
        db,
        me,
        input([
          {
            description: "X",
            quantity: null,
            amountCents: 0,
            productId: null,
            toPantry: false,
          },
        ]),
      ),
    ).toEqual({ ok: false, errors: { lines: "not_positive" } });
    expect(await listMovements(db, me, "2026-10-01", "2026-10-31")).toEqual([]);
  });

  it("counts a weight in kg as packages of the product", async () => {
    const { productId } = await oatsProduct(me);
    await saveReceipt(
      db,
      me,
      input([
        {
          description: "AVENA SFUSA",
          quantity: "0.75",
          amountCents: 300,
          productId,
          toPantry: true,
        },
      ]),
    );
    const [purchase] = await listPurchases(db, me, productId);
    expect(purchase?.packages).toBe("1.50"); // 750 g of a 500 g package
  });
});
