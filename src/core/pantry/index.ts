/**
 * core/pantry/index.ts — the Dispensa's repository (dossiers/pantry.md):
 * purchases (`purchase` entries «of» a food, product or format, with the
 * total they brought in), counts (`stock_count` «of» a food) and the meals
 * already logged, gathered per food for `stock.ts`. Products and formats
 * are summed into their food, since the meals log foods (§9.1). Only foods
 * bought or counted at least once are read: the database is billed by
 * transfer, and a food never bought has no stock to show (§8.5).
 */
import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogValues,
  entries,
  entryLines,
  entryValues,
} from "../db/schema";
import Big from "big.js";
import { addDays, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { stockOf, toBuy, type Stock, type StockEvent } from "./stock";
import { EATEN_KINDS } from "../kinds";

/** «Faccio la spesa ogni N giorni» (§9.3); a setting later, a week for now. */
export const SHOP_EVERY_DAYS = 7;
const WINDOW = 28;

export type PantryFood = {
  foodId: string;
  name: string;
  unit: string;
  stock: Stock;
  toBuy: boolean;
  /** The last purchase, to prefill «Comprato» (§4). */
  last: {
    itemId: string;
    packages: string | null;
    quantity: string;
    priceCents: number | null;
    shop: string | null;
    day: IsoDate;
  } | null;
};

/** "2.0000" (numeric's scale) → "2", to prefill a field. */
const plain = (x: string | null) => (x === null ? null : new Big(x).toString());

/** Each catalog id's food: itself, a product's parent, a format's product's parent. */
async function foodsOf(db: Db, owner: Owner, ids: readonly string[]) {
  const items = new Map<
    string,
    { catalog: string; name: string; parentId: string | null }
  >();
  let ask = [...new Set(ids)];
  // At most two steps up: format → product → food.
  for (let step = 0; step < 3 && ask.length; step++) {
    const rows = await db
      .select({
        id: catalogItems.id,
        catalog: catalogItems.catalog,
        name: catalogItems.name,
        parentId: catalogItems.parentId,
      })
      .from(catalogItems)
      .where(and(ownedBy(catalogItems, owner), inArray(catalogItems.id, ask)));
    for (const r of rows) items.set(r.id, r);
    ask = rows.flatMap((r) =>
      r.catalog !== "food" && r.parentId && !items.has(r.parentId) ? [r.parentId] : [],
    );
  }
  const food = (id: string): string | null => {
    let at = items.get(id);
    let cur = id;
    for (let i = 0; at && at.catalog !== "food" && i < 3; i++) {
      if (!at.parentId) return null;
      cur = at.parentId;
      at = items.get(cur);
    }
    return at?.catalog === "food" ? cur : null;
  };
  return { food, name: (id: string) => items.get(id)?.name ?? "" };
}

/** The tracked foods with their stock at `now`, those running out first. */
export async function readPantry(
  db: Db,
  owner: Owner,
  today: IsoDate,
  now: Date,
): Promise<PantryFood[]> {
  const events = await db
    .select({
      id: entries.id,
      kind: entries.kind,
      day: entries.day,
      startAt: entries.startAt,
      itemId: entries.itemId,
    })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        inArray(entries.kind, ["purchase", "stock_count"]),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        lte(entries.day, today),
      ),
    );
  const withItem = events.filter((e) => e.itemId !== null);
  if (withItem.length === 0) return [];
  const { food, name } = await foodsOf(
    db,
    owner,
    withItem.map((e) => e.itemId!),
  );
  const tracked = [...new Set(withItem.flatMap((e) => food(e.itemId!) ?? []))];
  if (tracked.length === 0) return [];
  const first = withItem.reduce((m, e) => (e.day < m ? e.day : m), today);
  const since =
    first < addDays(today, -(WINDOW - 1)) ? first : addDays(today, -(WINDOW - 1));
  const [values, units, lines, days] = await Promise.all([
    db
      .select({
        entryId: entryValues.entryId,
        field: entryValues.field,
        num: entryValues.num,
        text: entryValues.text,
      })
      .from(entryValues)
      .where(
        and(
          ownedBy(entryValues, owner),
          inArray(
            entryValues.entryId,
            withItem.map((e) => e.id),
          ),
        ),
      ),
    db
      .select({ itemId: catalogValues.itemId, text: catalogValues.text })
      .from(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          inArray(catalogValues.itemId, tracked),
          eq(catalogValues.field, "unit"),
        ),
      ),
    db
      .select({
        itemId: entryLines.itemId,
        quantity: entryLines.quantity,
        unit: entryLines.unit,
        entryId: entries.id,
        day: entries.day,
        startAt: entries.startAt,
      })
      .from(entryLines)
      .innerJoin(
        entries,
        and(eq(entries.id, entryLines.entryId), eq(entries.userId, entryLines.userId)),
      )
      .where(
        and(
          ownedBy(entryLines, owner),
          inArray(entryLines.itemId, tracked),
          inArray(entries.kind, [...EATEN_KINDS]),
          eq(entries.status, "done"),
          isNull(entries.deletedAt),
          gte(entries.day, since),
          lte(entries.day, today),
        ),
      ),
    // The days with any meal logged in the pace's window (§5).
    db
      .selectDistinct({ day: entries.day })
      .from(entries)
      .where(
        and(
          ownedBy(entries, owner),
          inArray(entries.kind, [...EATEN_KINDS]),
          eq(entries.status, "done"),
          isNull(entries.deletedAt),
          gte(entries.day, addDays(today, -(WINDOW - 1))),
          lte(entries.day, today),
        ),
      ),
  ]);
  const servings = lines.length
    ? await db
        .select({ entryId: entryValues.entryId, num: entryValues.num })
        .from(entryValues)
        .where(
          and(
            ownedBy(entryValues, owner),
            eq(entryValues.field, "servings"),
            inArray(entryValues.entryId, [...new Set(lines.map((l) => l.entryId))]),
          ),
        )
    : [];
  const times = new Map(servings.map((s) => [s.entryId, s.num]));
  const val = (id: string, f: string) =>
    values.find((v) => v.entryId === id && v.field === f);
  const unitOf = new Map(units.map((u) => [u.itemId, u.text ?? "g"]));
  const loggedDays = new Set(days.map((d) => d.day as IsoDate));
  const at = (day: string, startAt: Date | null) =>
    startAt ?? new Date(day + "T12:00:00Z");

  const out: PantryFood[] = [];
  for (const foodId of tracked) {
    const unit = unitOf.get(foodId) ?? "g";
    const evs: StockEvent[] = [];
    let last: PantryFood["last"] = null;
    for (const e of withItem) {
      if (food(e.itemId!) !== foodId) continue;
      const q = val(e.id, "quantity")?.num;
      if (q == null) continue;
      evs.push({
        kind: e.kind === "purchase" ? "in" : "count",
        at: at(e.day, e.startAt),
        day: e.day as IsoDate,
        quantity: q,
      });
      if (e.kind === "purchase" && (!last || e.day >= last.day)) {
        const price = val(e.id, "priceCents")?.num;
        last = {
          itemId: e.itemId!,
          packages: plain(val(e.id, "packages")?.num ?? null),
          quantity: plain(q)!,
          priceCents: price == null ? null : Number(price),
          shop: val(e.id, "shop")?.text ?? null,
          day: e.day as IsoDate,
        };
      }
    }
    for (const l of lines) {
      // A line in another unit (pieces of a food kept in grams) cannot be taken out (§7).
      if (l.itemId !== foodId || l.unit !== unit) continue;
      const t = times.get(l.entryId);
      evs.push({
        kind: "out",
        at: at(l.day, l.startAt),
        day: l.day as IsoDate,
        quantity: t == null ? l.quantity : String(Number(l.quantity) * Number(t)),
      });
    }
    const stock = stockOf(evs, now, { today, loggedDays, windowDays: WINDOW });
    out.push({
      foodId,
      name: name(foodId),
      unit,
      stock,
      toBuy: toBuy(stock, { shopEveryDays: SHOP_EVERY_DAYS }),
      last,
    });
  }
  return out.sort(
    (a, b) =>
      (a.stock.daysLeft ?? 9999) - (b.stock.daysLeft ?? 9999) ||
      a.name.localeCompare(b.name, "it"),
  );
}

/** «Comprato»: a purchase «of» a food, product or format, with what it brought in. */
export async function logPurchase(
  db: Db,
  owner: Owner,
  p: {
    itemId: string;
    day: IsoDate;
    at: Date;
    quantity: string;
    packages: string | null;
    priceCents: number | null;
    shop: string | null;
  },
): Promise<string> {
  return writeEvent(db, owner, "purchase", p.itemId, p.day, p.at, [
    { field: "quantity", num: p.quantity },
    ...(p.packages ? [{ field: "packages", num: p.packages }] : []),
    ...(p.priceCents !== null
      ? [{ field: "priceCents", num: String(p.priceCents) }]
      : []),
    ...(p.shop ? [{ field: "shop", text: p.shop }] : []),
  ]);
}

/** «Ne ho…»: what is at home now of a food; it replaces the books from this moment. */
export async function logCount(
  db: Db,
  owner: Owner,
  p: { foodId: string; day: IsoDate; at: Date; quantity: string },
): Promise<string> {
  return writeEvent(db, owner, "stock_count", p.foodId, p.day, p.at, [
    { field: "quantity", num: p.quantity },
  ]);
}

async function writeEvent(
  db: Db,
  owner: Owner,
  kind: "purchase" | "stock_count",
  itemId: string,
  day: IsoDate,
  at: Date,
  vals: { field: string; num?: string; text?: string }[],
): Promise<string> {
  return db.transaction(async (tx) => {
    // The item must be the owner's: another person's id writes nothing.
    const [mine] = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(and(ownedBy(catalogItems, owner), eq(catalogItems.id, itemId)));
    if (!mine) throw new Error("not found");
    const [row] = await tx
      .insert(entries)
      .values({
        userId: owner.id,
        kind,
        day,
        status: "done",
        startAt: at,
        itemId,
        source: "typed",
      })
      .returning({ id: entries.id });
    await tx.insert(entryValues).values(
      vals.map((v) => ({
        userId: owner.id,
        entryId: row!.id,
        field: v.field,
        num: v.num ?? null,
        text: v.text ?? null,
      })),
    );
    return row!.id;
  });
}
