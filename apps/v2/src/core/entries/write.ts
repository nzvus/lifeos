/**
 * core/entries/write.ts — the entries repository's writes. An entry and its
 * values go in one transaction, owned by the owner (ADR-0057): a half-made
 * entry never shows on a day.
 */
import type { Db } from "../db/db";
import { entries, entryValues } from "../db/schema";
import type { Owner } from "../identity/owner";
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
