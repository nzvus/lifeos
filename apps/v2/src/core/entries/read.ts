/**
 * core/entries/read.ts — one live entry by id, composed as its day shows
 * it (values, lines with their snapshot, children): what its sheet or its
 * composer opens with. Owned by the owner: another person's id reads as
 * none.
 */
import { and, desc, eq, gte, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { entries } from "../db/schema";
import { loadDays, type ClockRead, type Day, type DayItem } from "../day";
import { addDays, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export async function readEntry(
  db: Db,
  owner: Owner,
  id: string,
): Promise<(DayItem & { day: IsoDate }) | null> {
  return (await readEntryWithDays(db, owner, id))?.item ?? null;
}

/**
 * The entry and the days it was read from: its own day last, after the
 * `before` days that precede it — one set of queries, so a page that also
 * needs the day before (gym mode's context) does not read the day twice.
 */
export async function readEntryWithDays(
  db: Db,
  owner: Owner,
  id: string,
  opts: { before?: number; known?: ClockRead } = {},
): Promise<{ item: DayItem & { day: IsoDate }; days: Day[] } | null> {
  const [row] = await db
    .select({ day: entries.day, parentId: entries.parentId })
    .from(entries)
    .where(and(ownedBy(entries, owner), eq(entries.id, id), isNull(entries.deletedAt)));
  if (!row || row.parentId !== null) return null;
  const days = await loadDays(
    db,
    owner,
    addDays(row.day, -(opts.before ?? 0)),
    row.day,
    opts.known,
  );
  const own = days.at(-1)!;
  const item = [...own.timed, ...own.untimed].find((i) => i.id === id);
  return item ? { item: { ...item, day: row.day }, days } : null;
}

export type TrashedEntry = { id: string; kind: string; day: IsoDate; deletedAt: Date };
/** How long the trash keeps what was removed (V-01: «the 30-day trash»). */
export const TRASH_DAYS = 30;

/** The owner's entries removed in the last 30 days, the latest first (top-level only). */
export async function readTrash(
  db: Db,
  owner: Owner,
  now: Date,
): Promise<TrashedEntry[]> {
  const since = new Date(now.getTime() - TRASH_DAYS * 86_400_000);
  const rows = await db
    .select({
      id: entries.id,
      kind: entries.kind,
      day: entries.day,
      deletedAt: entries.deletedAt,
    })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        isNull(entries.parentId),
        isNotNull(entries.deletedAt),
        gte(entries.deletedAt, since),
      ),
    )
    .orderBy(desc(entries.deletedAt))
    .limit(200);
  return rows.map((r) => ({ ...r, deletedAt: r.deletedAt! }));
}
