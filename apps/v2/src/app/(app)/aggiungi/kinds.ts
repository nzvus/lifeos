/**
 * The kinds ⊕ can enter for this person (V-02): the built-ins and their own
 * kinds that `enterable` allows, without the archived ones; and the day the
 * sheet is for (`?giorno=`), today when missing or malformed.
 */
import "server-only";
import type { Db } from "@/core/db/db";
import { readClock, readUserKinds } from "@/core/day";
import { enterable } from "@/core/entries";
import { logicalDay, type DayClock, type IsoDate } from "@/core/engines/time";
import type { Owner } from "@/core/identity/owner";
import { kindRegistry, type Kind } from "@/core/kinds";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function addContext(
  db: Db,
  owner: Owner,
  giorno: string | string[] | undefined,
): Promise<{ kinds: Kind[]; clock: DayClock; today: IsoDate; day: IsoDate }> {
  const [{ clock }, rows] = await Promise.all([
    readClock(db, owner),
    readUserKinds(db, owner),
  ]);
  const archived = new Set(rows.filter((r) => r.archivedAt).map((r) => r.key));
  const kinds = kindRegistry(rows).all.filter(
    (k) => enterable(k) && !archived.has(k.key),
  );
  const today = logicalDay(new Date(), clock);
  const day = typeof giorno === "string" && ISO.test(giorno) ? giorno : today;
  return { kinds, clock, today, day };
}
