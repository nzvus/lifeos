/**
 * core/entries/write.ts — the entries repository's writes. An entry and its
 * values go in one transaction, owned by the owner (ADR-0057): a half-made
 * entry never shows on a day. Every change is `ownedBy` the owner: another
 * person's id changes nothing and reads as "not found" (null / false).
 * Removing moves to the 30-day trash (`deleted_at`, schema.md); restoring
 * brings it back as it was.
 */
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { entries, entryValues } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import type { CheckedEntry } from "./check";

/** Writes a checked entry typed by the person; returns its id. */
export async function createEntry(
  db: Db,
  owner: Owner,
  e: CheckedEntry,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(entries)
      .values({
        userId: owner.id,
        kind: e.kind,
        day: e.day,
        status: e.status,
        startAt: e.startAt,
        endAt: e.endAt,
        note: e.note,
        source: "typed",
      })
      .returning({ id: entries.id });
    const id = row!.id;
    if (e.values.length > 0)
      await tx.insert(entryValues).values(
        e.values.map((v) => ({
          userId: owner.id,
          entryId: id,
          field: v.field,
          num: v.num ?? null,
          text: v.text ?? null,
          bool: v.bool ?? null,
        })),
      );
    return id;
  });
}

export type Status = CheckedEntry["status"] | "skipped";

/** Planned ↔ done, or skipped; returns the status it had, or null if not found. */
export async function setEntryStatus(
  db: Db,
  owner: Owner,
  id: string,
  status: Status,
): Promise<Status | null> {
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select({ status: entries.status })
      .from(entries)
      .where(and(ownedBy(entries, owner), eq(entries.id, id), isNull(entries.deletedAt)))
      .for("update");
    if (!before) return null;
    await tx
      .update(entries)
      .set({ status })
      .where(and(ownedBy(entries, owner), eq(entries.id, id)));
    return before.status;
  });
}

/** Moves a live entry to the trash; false if there was none. */
export async function trashEntry(db: Db, owner: Owner, id: string): Promise<boolean> {
  const rows = await db
    .update(entries)
    .set({ deletedAt: new Date() })
    .where(and(ownedBy(entries, owner), eq(entries.id, id), isNull(entries.deletedAt)))
    .returning({ id: entries.id });
  return rows.length > 0;
}

/** Brings an entry back from the trash; false if it was not there. */
export async function restoreEntry(db: Db, owner: Owner, id: string): Promise<boolean> {
  const rows = await db
    .update(entries)
    .set({ deletedAt: null })
    .where(and(ownedBy(entries, owner), eq(entries.id, id), isNotNull(entries.deletedAt)))
    .returning({ id: entries.id });
  return rows.length > 0;
}
