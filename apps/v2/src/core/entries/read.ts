/**
 * core/entries/read.ts — one live entry by id, composed as its day shows
 * it (values, lines with their snapshot, children): what its sheet or its
 * composer opens with. Owned by the owner: another person's id reads as
 * none.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { entries } from "../db/schema";
import { loadDay, type DayItem } from "../day";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export async function readEntry(
  db: Db,
  owner: Owner,
  id: string,
): Promise<(DayItem & { day: IsoDate }) | null> {
  const [row] = await db
    .select({ day: entries.day, parentId: entries.parentId })
    .from(entries)
    .where(and(ownedBy(entries, owner), eq(entries.id, id), isNull(entries.deletedAt)));
  if (!row || row.parentId !== null) return null;
  const day = await loadDay(db, owner, row.day);
  const item = [...day.timed, ...day.untimed].find((i) => i.id === id);
  return item ? { ...item, day: row.day } : null;
}
