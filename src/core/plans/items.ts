/**
 * core/plans/items.ts — what the Piano's repositories share about catalog objects (MOD-36):
 * «is this one of his, of that catalog» and a few of their text values. Every query `ownedBy`.
 */
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogValues } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";

/** One of his objects of `catalog`, not deleted (archived ones too). */
export async function ownsItem(
  db: Pick<Db, "select">,
  owner: Owner,
  id: string,
  catalog: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: catalogItems.id })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.id, id),
        eq(catalogItems.catalog, catalog),
        isNull(catalogItems.deletedAt),
      ),
    );
  return !!row;
}

/** Some text values of some of his objects, as a lookup by object and field. */
export async function textValues(
  db: Pick<Db, "select">,
  owner: Owner,
  ids: readonly string[],
  fields: readonly string[],
): Promise<(id: string, field: string) => string | null> {
  const rows = ids.length
    ? await db
        .select({
          itemId: catalogValues.itemId,
          field: catalogValues.field,
          text: catalogValues.text,
        })
        .from(catalogValues)
        .where(
          and(
            ownedBy(catalogValues, owner),
            inArray(catalogValues.itemId, [...ids]),
            inArray(catalogValues.field, [...fields]),
          ),
        )
    : [];
  return (id, field) =>
    rows.find((r) => r.itemId === id && r.field === field)?.text ?? null;
}
