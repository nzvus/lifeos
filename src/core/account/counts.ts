/**
 * core/account/counts.ts — the few numbers Impostazioni shows (the board
 * Settings): the live foods in the catalog, the person's own kinds
 * (trackers), the entries in the trash (30 days). Three `count(*)`, no rows.
 */
import { and, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, entries, kinds } from "../db/schema";
import { TRASH_DAYS } from "../entries/read";
import { ownedBy, type Owner } from "../identity/owner";

export async function readSettingsCounts(
  db: Db,
  owner: Owner,
  now: Date,
): Promise<{ foods: number; kinds: number; trash: number }> {
  const n = sql<number>`count(*)::int`;
  const since = new Date(now.getTime() - TRASH_DAYS * 86_400_000);
  const [[foods], [own], [trash]] = await Promise.all([
    db
      .select({ n })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.catalog, "food"),
          isNull(catalogItems.deletedAt),
          isNull(catalogItems.archivedAt),
        ),
      ),
    db
      .select({ n })
      .from(kinds)
      .where(and(ownedBy(kinds, owner), isNull(kinds.archivedAt))),
    db
      .select({ n })
      .from(entries)
      .where(
        and(
          ownedBy(entries, owner),
          isNull(entries.parentId),
          isNotNull(entries.deletedAt),
          gte(entries.deletedAt, since),
        ),
      ),
  ]);
  return { foods: foods?.n ?? 0, kinds: own?.n ?? 0, trash: trash?.n ?? 0 };
}
