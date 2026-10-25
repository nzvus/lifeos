/**
 * core/money — the person's money (V-11): a movement is an entry of kind
 * `movement` with its exact signed cents (spending < 0) in `money_movements`,
 * written together in one transaction; its category is a `money_category`
 * catalog item (v1's, carried by the converter). `checkAmount` reads what is
 * typed («12,50», «12.5», «-3»). Every read and write is the owner's.
 */
import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogValues, entries, moneyMovements } from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  kind: "income" | "expense";
};

export type Movement = {
  id: string;
  day: IsoDate;
  startAt: Date | null;
  cents: number;
  categoryId: string | null;
  shop: string;
  method: string | null;
  note: string;
};

/** Pure: a typed amount in cents (always positive), or null. */
export function checkAmount(typed: string): number | null {
  const s = typed.trim().replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 ? cents : null;
}

export async function readCategories(db: Db, owner: Owner): Promise<Category[]> {
  const items = await db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      parentId: catalogItems.parentId,
    })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "money_category"),
        isNull(catalogItems.deletedAt),
        isNull(catalogItems.archivedAt),
      ),
    );
  if (items.length === 0) return [];
  const kinds = await db
    .select({ itemId: catalogValues.itemId, text: catalogValues.text })
    .from(catalogValues)
    .where(
      and(
        ownedBy(catalogValues, owner),
        eq(catalogValues.field, "kind"),
        inArray(
          catalogValues.itemId,
          items.map((i) => i.id),
        ),
      ),
    );
  const kindOf = new Map(kinds.map((k) => [k.itemId, k.text]));
  return items.map((i) => ({
    ...i,
    kind: kindOf.get(i.id) === "income" ? "income" : "expense",
  }));
}

/** Writes a movement: its entry and its money, together; its id. */
export async function createMovement(
  db: Db,
  owner: Owner,
  m: Omit<Movement, "id">,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(entries)
      .values({
        userId: owner.id,
        kind: "movement",
        day: m.day,
        status: "done",
        startAt: m.startAt,
        note: m.note,
        source: "typed",
      })
      .returning({ id: entries.id });
    await tx.insert(moneyMovements).values({
      entryId: row!.id,
      userId: owner.id,
      amountCents: m.cents,
      categoryId: m.categoryId,
      shop: m.shop,
      method: m.method,
    });
    return row!.id;
  });
}

/** The live movements from `from` to `to`, oldest first. */
export async function readMovements(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
): Promise<Movement[]> {
  const rows = await db
    .select({
      id: entries.id,
      day: entries.day,
      startAt: entries.startAt,
      note: entries.note,
      cents: moneyMovements.amountCents,
      categoryId: moneyMovements.categoryId,
      shop: moneyMovements.shop,
      method: moneyMovements.method,
    })
    .from(entries)
    .innerJoin(
      moneyMovements,
      and(
        eq(moneyMovements.entryId, entries.id),
        eq(moneyMovements.userId, entries.userId),
      ),
    )
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "movement"),
        isNull(entries.deletedAt),
        gte(entries.day, from),
        lte(entries.day, to),
      ),
    );
  return rows.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0),
  );
}

/** Changes a movement (its entry's day stays); false when it is not the owner's live movement. */
export async function updateMovement(
  db: Db,
  owner: Owner,
  id: string,
  m: Omit<Movement, "id" | "day">,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const done = await tx
      .update(entries)
      .set({ startAt: m.startAt, note: m.note })
      .where(
        and(
          ownedBy(entries, owner),
          eq(entries.id, id),
          eq(entries.kind, "movement"),
          isNull(entries.deletedAt),
        ),
      )
      .returning({ id: entries.id });
    if (done.length === 0) return false;
    await tx
      .update(moneyMovements)
      .set({
        amountCents: m.cents,
        categoryId: m.categoryId,
        shop: m.shop,
        method: m.method,
      })
      .where(and(ownedBy(moneyMovements, owner), eq(moneyMovements.entryId, id)));
    return true;
  });
}
