/**
 * core/pantry/repositories/stock.ts — the pantry as it is now (ADR-0013/0017):
 * for every food (per ingredient) and every other product, what is left,
 * the daily use and when it runs out, from the events (core/pantry/stock.ts).
 *
 * Events gathered here, all owner-filtered and live only:
 *   in    purchases: packages × the product's package size
 *   out   eaten log lines × servings, except portions taken from a batch
 *         (their ingredients left when the batch was cooked)
 *   out   batch lines, at the moment the batch was cooked
 *   count stock counts
 * Only things ever bought or counted are in the pantry.
 *
 * Tested in: stock.test.ts.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  batches,
  batchLines,
  ingredients,
  logEntries,
  logEntryItems,
  products,
  purchases,
  stockCounts,
} from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { Big } from "../../shared/decimal";
import { live } from "../../shared/trash";
import { stockOf, type Stock, type StockEvent } from "../stock";

export type PantryItem = Stock & {
  kind: "ingredient" | "product";
  id: string;
  name: string;
  unit: "g" | "ml" | "piece";
};

/** A day with no time, placed at noon UTC so no time zone moves it. */
const noon = (day: string) => `${day}T12:00:00.000Z`;
const start = (day: string) => `${day}T00:00:00.000Z`;

export async function getPantry(
  db: Db,
  owner: Owner,
  now: Date = new Date(),
): Promise<PantryItem[]> {
  const [bought, eaten, cooked, counts, ingRows, productRows] = await Promise.all([
    db
      .select({
        productId: products.id,
        ingredientId: products.ingredientId,
        size: products.packageSize,
        packages: purchases.packages,
        day: purchases.day,
      })
      .from(purchases)
      .innerJoin(products, eq(purchases.productId, products.id))
      .where(and(ownedBy(purchases, owner), live(purchases), live(products))),
    db
      .select({
        ingredientId: logEntryItems.ingredientId,
        quantity: logEntryItems.quantity,
        servings: logEntries.servings,
        at: logEntries.at,
        day: logEntries.day,
      })
      .from(logEntryItems)
      .innerJoin(logEntries, eq(logEntryItems.entryId, logEntries.id))
      .where(
        and(
          ownedBy(logEntries, owner),
          live(logEntries),
          eq(logEntries.status, "eaten"),
          isNull(logEntries.batchId),
        ),
      ),
    db
      .select({
        ingredientId: batchLines.ingredientId,
        quantity: batchLines.quantity,
        at: batches.cookedAt,
      })
      .from(batchLines)
      .innerJoin(batches, eq(batchLines.batchId, batches.id))
      .where(and(ownedBy(batches, owner), live(batches))),
    db.select().from(stockCounts).where(ownedBy(stockCounts, owner)),
    db
      .select({ id: ingredients.id, name: ingredients.name, unit: ingredients.unit })
      .from(ingredients)
      .where(and(ownedBy(ingredients, owner), live(ingredients))),
    db
      .select({
        id: products.id,
        name: products.name,
        unit: products.unit,
        ingredientId: products.ingredientId,
      })
      .from(products)
      .where(and(ownedBy(products, owner), live(products))),
  ]);

  const events = new Map<string, StockEvent[]>();
  const push = (key: string, e: StockEvent) =>
    events.set(key, [...(events.get(key) ?? []), e]);
  const tracked = new Set<string>(); // bought or counted at least once

  for (const b of bought) {
    const key = b.ingredientId ? `i:${b.ingredientId}` : `p:${b.productId}`;
    tracked.add(key);
    push(key, {
      kind: "in",
      at: start(b.day),
      quantity: new Big(b.packages).times(b.size).toString(),
    });
  }
  for (const c of counts) {
    const key = c.ingredientId ? `i:${c.ingredientId}` : `p:${c.productId}`;
    tracked.add(key);
    push(key, { kind: "count", at: c.at.toISOString(), quantity: c.quantity });
  }
  for (const e of eaten) {
    if (!e.ingredientId) continue; // estimated meals and deleted ingredients: no stock
    push(`i:${e.ingredientId}`, {
      kind: "out",
      at: e.at ? e.at.toISOString() : noon(e.day),
      quantity: new Big(e.quantity).times(e.servings).toString(),
    });
  }
  for (const l of cooked) {
    if (!l.ingredientId) continue;
    push(`i:${l.ingredientId}`, {
      kind: "out",
      at: l.at.toISOString(),
      quantity: l.quantity,
    });
  }

  const items: PantryItem[] = [];
  for (const i of ingRows) {
    const key = `i:${i.id}`;
    if (!tracked.has(key)) continue;
    items.push({
      kind: "ingredient",
      id: i.id,
      name: i.name,
      unit: i.unit,
      ...stockOf(events.get(key) ?? [], now),
    });
  }
  for (const p of productRows) {
    if (p.ingredientId) continue; // food: counted on its ingredient
    const key = `p:${p.id}`;
    if (!tracked.has(key)) continue;
    items.push({
      kind: "product",
      id: p.id,
      name: p.name,
      unit: p.unit,
      ...stockOf(events.get(key) ?? [], now),
    });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The shopping list: what is gone, or runs out within `horizonDays` at the
 * current pace, soonest first.
 */
export function shoppingList(
  items: readonly PantryItem[],
  horizonDays = 7,
): PantryItem[] {
  return items
    .filter(
      (i) =>
        new Big(i.quantity).eq(0) || (i.daysLeft !== null && i.daysLeft <= horizonDays),
    )
    .sort(
      (a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0) || a.name.localeCompare(b.name),
    );
}
