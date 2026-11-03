/**
 * core/food/creatine-read.ts — the creatine eaten in the window before a day
 * (dossiers/compounds.md §4): the done eaten entries' lines whose food has a
 * `creatine` compound, one narrow query. By the compound, never by the name.
 */
import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogValues, entries, entryLines, entryValues } from "../db/schema";
import { addDays, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { EATEN_KINDS } from "../kinds";
import { readNumbers } from "../goals/read";
import { CREATINE_WINDOW, creatineOn, dosesByDay, type CreatineState } from "./creatine";

export async function readCreatineDoses(
  db: Db,
  owner: Owner,
  day: IsoDate,
): Promise<Map<IsoDate, number>> {
  const rows = await db
    .select({
      day: entries.day,
      quantity: entryLines.quantity,
      per100: catalogValues.num,
      servings: sql<string | null>`(
        select ${entryValues.num}::text from ${entryValues}
        where ${entryValues.entryId} = ${entries.id} and ${entryValues.field} = 'servings'
      )`,
    })
    .from(entryLines)
    .innerJoin(
      entries,
      and(eq(entries.id, entryLines.entryId), eq(entries.userId, entryLines.userId)),
    )
    .innerJoin(
      catalogValues,
      and(
        eq(catalogValues.itemId, entryLines.itemId),
        eq(catalogValues.userId, entryLines.userId),
        eq(catalogValues.field, "creatine"),
      ),
    )
    .where(
      and(
        ownedBy(entries, owner),
        inArray(entries.kind, [...EATEN_KINDS]),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        gte(entries.day, addDays(day, -CREATINE_WINDOW)),
        lte(entries.day, day),
      ),
    );
  return dosesByDay(
    rows.flatMap((r) => (r.per100 === null ? [] : [{ ...r, per100: r.per100 }])),
  );
}

/** Without a weigh-in in the 28 days before, the stores are sized for this body. */
export const CREATINE_WEIGHT_KG = 75;

/** The stores on `day` (Oggi, a session): the doses of the window and the last weigh-in's size. */
export async function readCreatine(
  db: Db,
  owner: Owner,
  day: IsoDate,
): Promise<CreatineState | null> {
  const [doses, weights] = await Promise.all([
    readCreatineDoses(db, owner, day),
    readNumbers(db, owner, "weigh_in", "weightKg", addDays(day, -28), day),
  ]);
  if (doses.size === 0) return null;
  const last = [...weights].sort((a, b) => a.day.localeCompare(b.day)).at(-1);
  return creatineOn(doses, day, last?.n ?? CREATINE_WEIGHT_KG);
}
