/**
 * core/catalog/archive.ts — archiving a catalog item (a food, a saved meal,
 * an exercise): out of the lists, the composer and gym mode; entries logged
 * with it keep it (they hold their snapshot, ADR-0007). Owned and live only.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";

export async function archiveItem(
  db: Db,
  owner: Owner,
  id: string,
  catalog: "food" | "recipe" | "exercise",
): Promise<boolean> {
  const done = await db
    .update(catalogItems)
    .set({ archivedAt: new Date() })
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.id, id),
        eq(catalogItems.catalog, catalog),
        isNull(catalogItems.deletedAt),
      ),
    )
    .returning({ id: catalogItems.id });
  return done.length > 0;
}
