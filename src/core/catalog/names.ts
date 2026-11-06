/**
 * core/catalog/names.ts — the names ⊕'s one search looks through (V-02):
 * the owner's live foods, saved meals and routines, name and id only (no
 * values: the search needs the words, and the database is billed by
 * transfer). Archived and deleted items are left out; products are found
 * through their food.
 */
import { and, inArray, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";

export type CatalogName = {
  id: string;
  catalog: "food" | "recipe" | "routine";
  name: string;
};

export async function readCatalogNames(db: Db, owner: Owner): Promise<CatalogName[]> {
  const rows = await db
    .select({
      id: catalogItems.id,
      catalog: catalogItems.catalog,
      name: catalogItems.name,
    })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        inArray(catalogItems.catalog, ["food", "recipe", "routine"]),
        isNull(catalogItems.parentId),
        isNull(catalogItems.archivedAt),
        isNull(catalogItems.deletedAt),
      ),
    );
  return (rows as CatalogName[]).sort((a, b) => a.name.localeCompare(b.name, "it"));
}
