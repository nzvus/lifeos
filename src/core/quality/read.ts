/**
 * core/quality/read.ts — what E9 (data quality) reads for one kind: its live
 * done entries from `from` to `to`, with the value of one field (or 1 when
 * none is asked: the entry's presence), the local minute and whether it is
 * an estimate. Owned by the owner; one query.
 */
import { and, eq, gte, isNull, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import { entries, entryValues } from "../db/schema";
import type { QualityEntry } from "../engines/quality";
import { localParts, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export async function readQualityEntries(
  db: Db,
  owner: Owner,
  kind: string,
  field: string | null,
  from: IsoDate,
  to: IsoDate,
  timeZone: string,
): Promise<QualityEntry[]> {
  const where = and(
    ownedBy(entries, owner),
    eq(entries.kind, kind),
    eq(entries.status, "done"),
    isNull(entries.deletedAt),
    isNull(entries.parentId),
    gte(entries.day, from),
    lte(entries.day, to),
  );
  const minute = (d: Date | null) => (d ? localParts(d, timeZone).minute : undefined);
  if (field === null) {
    const rows = await db
      .select({
        id: entries.id,
        day: entries.day,
        at: entries.startAt,
        conf: entries.confidence,
      })
      .from(entries)
      .where(where);
    return rows.map((r) => ({
      id: r.id,
      day: r.day,
      minute: minute(r.at),
      value: 1,
      estimated: Number(r.conf) < 1,
    }));
  }
  const rows = await db
    .select({
      id: entries.id,
      day: entries.day,
      at: entries.startAt,
      conf: entries.confidence,
      num: entryValues.num,
    })
    .from(entries)
    .innerJoin(
      entryValues,
      and(eq(entryValues.entryId, entries.id), eq(entryValues.userId, entries.userId)),
    )
    .where(and(where, eq(entryValues.field, field)));
  return rows.flatMap((r) =>
    r.num === null
      ? []
      : [
          {
            id: r.id,
            day: r.day,
            minute: minute(r.at),
            value: Number(r.num),
            estimated: Number(r.conf) < 1,
          },
        ],
  );
}
