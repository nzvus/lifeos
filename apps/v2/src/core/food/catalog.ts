/**
 * core/food/catalog.ts — the composer's choices read for an owner (V-04):
 * live foods and products, their values, their use in the last 90 days;
 * `choices.ts` makes them choices.
 *
 * The snapshot a line keeps (ADR-0007) is taken from here, on the server:
 * never from values a client sends.
 */
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogValues, entries, entryLines } from "../db/schema";
import { addDays, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { foodChoices, SNAPSHOT_FIELDS, USE_DAYS, type FoodChoice } from "./choices";

/** The owner's live foods and products as choices, with their use up to `today`. */
export async function readFoodChoices(
  db: Db,
  owner: Owner,
  today: IsoDate,
): Promise<FoodChoice[]> {
  const items = await db
    .select({
      id: catalogItems.id,
      catalog: catalogItems.catalog,
      name: catalogItems.name,
      parentId: catalogItems.parentId,
    })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        inArray(catalogItems.catalog, ["food", "product"]),
        isNull(catalogItems.deletedAt),
        isNull(catalogItems.archivedAt),
      ),
    );
  if (items.length === 0) return [];
  const [values, uses] = await Promise.all([
    db
      .select({
        itemId: catalogValues.itemId,
        field: catalogValues.field,
        num: catalogValues.num,
        text: catalogValues.text,
      })
      .from(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          inArray(
            catalogValues.itemId,
            items.map((i) => i.id),
          ),
          inArray(catalogValues.field, [...SNAPSHOT_FIELDS, "unit"]),
        ),
      ),
    db
      .select({
        itemId: entryLines.itemId,
        productId: entryLines.productId,
        uses: sql<number>`count(*)::int`,
        lastQty: sql<
          string | null
        >`(array_agg(${entryLines.quantity}::text order by ${entries.day} desc, ${entries.startAt} desc nulls last))[1]`,
      })
      .from(entryLines)
      .innerJoin(
        entries,
        and(eq(entries.id, entryLines.entryId), eq(entries.userId, entryLines.userId)),
      )
      .where(
        and(
          ownedBy(entryLines, owner),
          eq(entries.kind, "meal"),
          eq(entries.status, "done"),
          isNull(entries.deletedAt),
          gte(entries.day, addDays(today, -USE_DAYS)),
        ),
      )
      .groupBy(entryLines.itemId, entryLines.productId)
      .orderBy(desc(sql`count(*)`)),
  ]);
  return foodChoices(
    items,
    values,
    uses.flatMap((u) => (u.itemId === null ? [] : [{ ...u, itemId: u.itemId }])),
  );
}
