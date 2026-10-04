/**
 * core/money/repositories/receipts.ts — a reviewed receipt saved (ADR-0036),
 * in ONE transaction:
 *   - the receipt's text (the source);
 *   - one movement: minus the sum of the lines, its category, shop, day;
 *   - its lines; a line linked to one of my products is remembered as an
 *     alias (the next receipt links it by itself) and, when asked, becomes
 *     a pantry purchase (ADR-0017: stock follows) at the line's price;
 *   - the product's ingredient takes the price just paid per package, so
 *     meal and day costs follow the receipts.
 * Money totals read the ledger only, never purchases: nothing counts twice.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  ingredients,
  moneyCategories,
  moneyLines,
  moneyMovements,
  moneyReceipts,
  products,
  purchases,
  receiptAliases,
} from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { Big } from "../../shared/decimal";
import { fail, ok, type Result } from "../../shared/result";
import { live } from "../../shared/trash";
import { aliasKey } from "../receipts";
import type { ReceiptInput } from "../validation";

export type ReceiptSummary = {
  id: string;
  day: string;
  shop: string;
  totalCents: number;
  lines: number;
  movementId: string | null;
};

/** How many packages a line is: pieces as printed; a weight in kg over the package. */
function packagesOf(quantity: string | null, unit: string, size: string): string {
  if (!quantity) return "1";
  const q = new Big(quantity);
  if (!q.round(0).eq(q) && unit === "g") {
    const p = q.times(1000).div(size).round(2, Big.roundHalfUp);
    return p.gt(0) ? p.toString() : "1";
  }
  return q.gt(0) ? q.round(2, Big.roundHalfUp).toString() : "1";
}

export async function saveReceipt(
  db: Db,
  owner: Owner,
  input: ReceiptInput,
): Promise<Result<{ movementId: string }>> {
  const lines = input.lines ?? [];
  const total = lines.reduce((a, l) => a + l.amountCents, 0);
  if (total <= 0) return fail({ lines: "not_positive" });
  if (input.categoryId) {
    const [c] = await db
      .select({ kind: moneyCategories.kind })
      .from(moneyCategories)
      .where(
        and(
          ownedBy(moneyCategories, owner),
          live(moneyCategories),
          eq(moneyCategories.id, input.categoryId),
        ),
      );
    if (!c || c.kind !== "expense") return fail({ categoryId: "invalid_choice" });
  }
  const productIds = [
    ...new Set(lines.flatMap((l) => (l.productId ? [l.productId] : []))),
  ];
  const mine = productIds.length
    ? await db
        .select({
          id: products.id,
          unit: products.unit,
          size: products.packageSize,
          ingredientId: products.ingredientId,
        })
        .from(products)
        .where(
          and(ownedBy(products, owner), live(products), inArray(products.id, productIds)),
        )
    : [];
  const byId = new Map(mine.map((p) => [p.id, p]));
  if (productIds.some((p) => !byId.has(p))) return fail({ lines: "not_found" });

  const movementId = await db.transaction(async (tx) => {
    const [receipt] = await tx
      .insert(moneyReceipts)
      .values({ userId: owner.id, day: input.day, shop: input.shop, text: input.text })
      .returning({ id: moneyReceipts.id });
    const [movement] = await tx
      .insert(moneyMovements)
      .values({
        userId: owner.id,
        day: input.day,
        amountCents: -total,
        categoryId: input.categoryId,
        shop: input.shop,
        method: input.method,
        receiptId: receipt!.id,
      })
      .returning({ id: moneyMovements.id });
    for (const [position, l] of lines.entries()) {
      const product = l.productId ? byId.get(l.productId) : undefined;
      let purchaseId: string | null = null;
      if (product) {
        const packages = packagesOf(l.quantity, product.unit, product.size);
        if (l.toPantry) {
          const [p] = await tx
            .insert(purchases)
            .values({
              userId: owner.id,
              productId: product.id,
              day: input.day,
              packages,
              priceCents: l.amountCents,
              shop: input.shop,
            })
            .returning({ id: purchases.id });
          purchaseId = p!.id;
        }
        await tx
          .insert(receiptAliases)
          .values({
            userId: owner.id,
            key: aliasKey(l.description),
            productId: product.id,
          })
          .onConflictDoUpdate({
            target: [receiptAliases.userId, receiptAliases.key],
            set: { productId: product.id },
          });
        // The price just paid, per package, becomes the ingredient's price.
        if (product.ingredientId && l.amountCents > 0)
          await tx
            .update(ingredients)
            .set({
              packagePriceCents: new Big(l.amountCents)
                .div(packages)
                .round(0, Big.roundHalfUp)
                .toNumber(),
              packageSize: product.size,
            })
            .where(
              and(ownedBy(ingredients, owner), eq(ingredients.id, product.ingredientId)),
            );
      }
      await tx.insert(moneyLines).values({
        userId: owner.id,
        movementId: movement!.id,
        position,
        description: l.description,
        quantity: l.quantity,
        amountCents: l.amountCents,
        productId: product?.id ?? null,
        purchaseId,
      });
    }
    return movement!.id;
  });
  return ok({ movementId });
}

/** My receipts, newest first, with their movement's total and line count. */
export async function listReceipts(db: Db, owner: Owner): Promise<ReceiptSummary[]> {
  const rows = await db
    .select({
      id: moneyReceipts.id,
      day: moneyReceipts.day,
      shop: moneyReceipts.shop,
      movementId: moneyMovements.id,
      totalCents: sql<number>`coalesce(-${moneyMovements.amountCents}, 0)`,
      lines: sql<number>`(select count(*) from ${moneyLines} where ${moneyLines.movementId} = ${moneyMovements.id})`,
    })
    .from(moneyReceipts)
    .leftJoin(
      moneyMovements,
      and(eq(moneyMovements.receiptId, moneyReceipts.id), live(moneyMovements)),
    )
    .where(and(ownedBy(moneyReceipts, owner), live(moneyReceipts)))
    .orderBy(desc(moneyReceipts.day), desc(moneyReceipts.createdAt));
  return rows.map((r) => ({
    ...r,
    totalCents: Number(r.totalCents),
    lines: Number(r.lines),
  }));
}

/** Receipt text → my product, remembered from earlier receipts. */
export async function receiptAliasMap(
  db: Db,
  owner: Owner,
): Promise<Record<string, string>> {
  const rows = await db
    .select({ key: receiptAliases.key, productId: receiptAliases.productId })
    .from(receiptAliases)
    .where(ownedBy(receiptAliases, owner));
  return Object.fromEntries(rows.map((r) => [r.key, r.productId]));
}

/** A movement's receipt lines (the movement page shows them). */
export async function movementLines(db: Db, owner: Owner, movementId: string) {
  return db
    .select({
      description: moneyLines.description,
      quantity: moneyLines.quantity,
      amountCents: moneyLines.amountCents,
      productName: products.name,
      inPantry: sql<boolean>`${moneyLines.purchaseId} is not null`,
    })
    .from(moneyLines)
    .leftJoin(products, eq(moneyLines.productId, products.id))
    .where(and(ownedBy(moneyLines, owner), eq(moneyLines.movementId, movementId)))
    .orderBy(moneyLines.position);
}
