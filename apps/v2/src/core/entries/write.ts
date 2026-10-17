/**
 * core/entries/write.ts — the entries repository's writes. An entry and its
 * values go in one transaction, owned by the owner (ADR-0057): a half-made
 * entry never shows on a day. Every change is `ownedBy` the owner: another
 * person's id changes nothing and reads as "not found" (null / false).
 * Removing moves to the 30-day trash (`deleted_at`, schema.md); restoring
 * brings it back as it was.
 */
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { entries, entryLines, entryLineValues, entryValues } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import type { CheckedEntry, CheckedLine } from "./check";

/** Writes a checked entry typed by the person, with its lines and their snapshot; returns its id. */
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
    await writeLines(tx, owner, id, e.lines ?? []);
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

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** A composite's lines and their snapshot, in the caller's transaction. */
async function writeLines(
  tx: Tx,
  owner: Owner,
  id: string,
  lines: readonly CheckedLine[],
) {
  if (lines.length > 0) {
    const made = await tx
      .insert(entryLines)
      .values(
        lines.map((l, position) => ({
          userId: owner.id,
          entryId: id,
          position,
          itemId: l.itemId,
          productId: l.productId,
          name: l.name,
          quantity: l.quantity,
          unit: l.unit,
        })),
      )
      .returning({ id: entryLines.id, position: entryLines.position });
    const snapshot = made.flatMap((m) =>
      Object.entries(lines[m.position]!.per100).map(([field, num]) => ({
        userId: owner.id,
        lineId: m.id,
        field,
        num,
      })),
    );
    if (snapshot.length > 0) await tx.insert(entryLineValues).values(snapshot);
  }
}

/**
 * Changes a live entry from its sheet or its composer: the entry's own
 * columns; the values of `managed` fields only (a field the form does not
 * show keeps its value); and, when `e.lines` is given, its lines, written
 * again with the snapshot they carry (an old line keeps its own, ADR-0007).
 * False when there is no such live entry for this owner.
 */
export async function updateEntry(
  db: Db,
  owner: Owner,
  id: string,
  e: CheckedEntry,
  managed: readonly string[],
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const done = await tx
      .update(entries)
      .set({
        day: e.day,
        status: e.status,
        startAt: e.startAt,
        endAt: e.endAt,
        note: e.note,
      })
      .where(and(ownedBy(entries, owner), eq(entries.id, id), isNull(entries.deletedAt)))
      .returning({ id: entries.id });
    if (done.length === 0) return false;
    if (managed.length > 0)
      await tx
        .delete(entryValues)
        .where(
          and(
            ownedBy(entryValues, owner),
            eq(entryValues.entryId, id),
            inArray(entryValues.field, [...managed]),
          ),
        );
    const values = e.values.filter((v) => managed.includes(v.field));
    if (values.length > 0)
      await tx.insert(entryValues).values(
        values.map((v) => ({
          userId: owner.id,
          entryId: id,
          field: v.field,
          num: v.num ?? null,
          text: v.text ?? null,
          bool: v.bool ?? null,
        })),
      );
    if (e.lines !== undefined) {
      await tx
        .delete(entryLines)
        .where(and(ownedBy(entryLines, owner), eq(entryLines.entryId, id)));
      await writeLines(tx, owner, id, e.lines);
    }
    return true;
  });
}
