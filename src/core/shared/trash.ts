/**
 * core/shared/trash.ts — the trash (ADR-0015): deleting a record sets its
 * `deleted_at`; it stays restorable for 30 days, then it is purged.
 * `live(table)` is the filter every list and lookup of a trashable table
 * uses next to `ownedBy()`, so a record in the trash is invisible
 * everywhere except the trash itself.
 */
import { isNull, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/** How long a record stays in the trash before it is deleted for good. */
export const TRASH_DAYS = 30;

export function live(table: { deletedAt: PgColumn }): SQL {
  return isNull(table.deletedAt);
}
