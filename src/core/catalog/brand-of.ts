/**
 * core/catalog/brand-of.ts — «È una marca di…» (ADR-0060, dossiers/objects.md
 * §6, his 17 near-duplicates): a food that is really a brand of another
 * («Passata di pomodoro (Mutti)» of «Passata di pomodoro») becomes a product
 * of it, keeping its own label values, and everything that pointed at it
 * moves there through «Unisci» — its logged lines keep their brand, the
 * saved meals keep it as their preferred product. Past snapshots never
 * change (ADR-0007): each day's totals stay the same (PROD-21).
 */
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogParts, catalogValues, entryLines } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { SNAPSHOT_FIELDS } from "../food/choices";
import { mergeItems } from "./merge";

/** The brand a food's name says («Passata di pomodoro (Mutti)» → «Mutti»), else null. */
export function brandInName(name: string): string | null {
  const m = /\(([^)]+)\)\s*$/.exec(name.trim());
  return m ? m[1]!.trim() : null;
}

/**
 * Makes `goneId` a brand of `keepId` (both live foods of the owner): its
 * products move under the kept food with the label values they lacked; with
 * none, a product named `brand` takes its values. Its lines without a
 * product point at that product; then «Unisci». False when either is not a
 * live food or they are the same.
 */
export async function makeBrandOf(
  db: Db,
  owner: Owner,
  goneId: string,
  keepId: string,
  brand: string,
): Promise<boolean> {
  if (goneId === keepId) return false;
  const name = brand.trim().replace(/\s+/g, " ").slice(0, 80) || "marca non indicata";
  const ok = await db.transaction(async (tx) => {
    const foods = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          inArray(catalogItems.id, [goneId, keepId]),
          eq(catalogItems.catalog, "food"),
          isNull(catalogItems.deletedAt),
        ),
      );
    if (foods.length !== 2) return false;
    const own = await tx
      .select({ field: catalogValues.field, num: catalogValues.num })
      .from(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          eq(catalogValues.itemId, goneId),
          inArray(catalogValues.field, [...SNAPSHOT_FIELDS]),
        ),
      );
    const products = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.catalog, "product"),
          eq(catalogItems.parentId, goneId),
          isNull(catalogItems.deletedAt),
        ),
      );
    let main: string;
    if (products.length === 0) {
      const [row] = await tx
        .insert(catalogItems)
        .values({ userId: owner.id, catalog: "product", name, parentId: goneId })
        .returning({ id: catalogItems.id });
      main = row!.id;
      products.push({ id: main });
    } else main = products[0]!.id;
    // Each product keeps the label it had through its food: the values it lacked.
    for (const p of products) {
      const has = await tx
        .select({ field: catalogValues.field })
        .from(catalogValues)
        .where(and(ownedBy(catalogValues, owner), eq(catalogValues.itemId, p.id)));
      const missing = own.filter(
        (v) => v.num !== null && !has.some((h) => h.field === v.field),
      );
      if (missing.length > 0)
        await tx.insert(catalogValues).values(
          missing.map((v) => ({
            userId: owner.id,
            itemId: p.id,
            field: v.field,
            num: v.num,
          })),
        );
    }
    await tx
      .update(entryLines)
      .set({ productId: main })
      .where(
        and(
          ownedBy(entryLines, owner),
          eq(entryLines.itemId, goneId),
          isNull(entryLines.productId),
        ),
      );
    await tx
      .update(catalogParts)
      .set({
        defaults: sql`${catalogParts.defaults} || ${JSON.stringify({ preferredProduct: main })}::jsonb`,
      })
      .where(
        and(
          ownedBy(catalogParts, owner),
          eq(catalogParts.partItemId, goneId),
          sql`not (${catalogParts.defaults} ? 'preferredProduct')`,
        ),
      );
    return true;
  });
  if (!ok) return false;
  return (await mergeItems(db, owner, keepId, goneId)) !== null;
}
