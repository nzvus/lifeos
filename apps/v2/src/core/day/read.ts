/**
 * core/day/read.ts — the repository of one logical day (V-01): every live
 * entry whose `day` is that day, with what hangs off it (values, lines and
 * their snapshots, sets, links, money) and the names of the items it points
 * at. Every query is `ownedBy` the owner, children included (ADR-0057).
 * Four rounds of queries, each by the ids the one before found: never one
 * query per entry.
 */
import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { addDays, type DayClock, type IsoDate } from "../engines/time";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogValues,
  entries,
  entryLines,
  entryLineValues,
  entryLinks,
  entryValues,
  kinds,
  moneyMovements,
  settings,
  trainingSets,
} from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { DEFAULT_ROLE_BOUNDS, type RoleBounds, type UserKindRow } from "../kinds";

export type EntryRow = typeof entries.$inferSelect;
export type ValueRow = typeof entryValues.$inferSelect;
export type LineRow = typeof entryLines.$inferSelect;
export type LineValueRow = typeof entryLineValues.$inferSelect;
export type SetRow = typeof trainingSets.$inferSelect;
export type LinkRow = typeof entryLinks.$inferSelect;
export type MoneyRow = typeof moneyMovements.$inferSelect;

export type DayRows = {
  day: IsoDate;
  clock: DayClock;
  roleBounds: RoleBounds;
  entries: EntryRow[];
  values: ValueRow[];
  lines: LineRow[];
  lineValues: LineValueRow[];
  sets: SetRow[];
  links: LinkRow[];
  money: MoneyRow[];
  /** Names of the catalog items the entries, values and lines point at. */
  items: { id: string; catalog: string; name: string }[];
  /** Those items' values that choose a drawing (icons.md §2): movement, equipment, group, dish. */
  itemValues: { itemId: string; field: string; text: string | null }[];
  userKinds: UserKindRow[];
};

/** The catalog fields Glyph reads to pick an item's drawing (icons.md §2). */
export const DRAWING_FIELDS = ["pattern", "equipment", "group", "dish"] as const;

const DEFAULT_CLOCK: DayClock = { timeZone: "Europe/Rome", boundaryMin: 240 };

/** The meal-role bounds kept in prefs (v1's lunchFrom…), each only if it is a clock minute. */
export function roleBoundsOf(prefs: Record<string, unknown>): RoleBounds {
  const pick = (k: keyof RoleBounds) => {
    const v = prefs[k];
    return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 1440
      ? v
      : DEFAULT_ROLE_BOUNDS[k];
  };
  return {
    lunchFrom: pick("lunchFrom"),
    snackFrom: pick("snackFrom"),
    dinnerFrom: pick("dinnerFrom"),
  };
}

/** The person's day clock (zone, boundary) and meal-role bounds; defaults when unset. */
export async function readClock(
  db: Db,
  owner: Owner,
): Promise<{ clock: DayClock; roleBounds: RoleBounds }> {
  const [set] = await db
    .select({
      timeZone: settings.timezone,
      boundaryMin: settings.dayBoundaryMin,
      prefs: settings.prefs,
    })
    .from(settings)
    .where(ownedBy(settings, owner));
  return {
    clock: set ? { timeZone: set.timeZone, boundaryMin: set.boundaryMin } : DEFAULT_CLOCK,
    roleBounds: roleBoundsOf(set?.prefs ?? {}),
  };
}

/** The person's own kinds as stored, for `kindRegistry`. */
export function readUserKinds(db: Db, owner: Owner): Promise<UserKindRow[]> {
  return db
    .select({
      key: kinds.key,
      domain: kinds.domain,
      shape: kinds.shape,
      entryMode: kinds.entryMode,
      definition: kinds.definition,
      archivedAt: kinds.archivedAt,
    })
    .from(kinds)
    .where(ownedBy(kinds, owner));
}

export async function readDay(db: Db, owner: Owner, day: IsoDate): Promise<DayRows> {
  return (await readDays(db, owner, day, day))[0]!;
}

/**
 * Every day from `from` to `to` (inclusive) with one set of queries, each
 * day's rows as `readDay` gives them: Andamento's ranges read 30 or 90 days
 * without 90 round trips.
 */
export async function readDays(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
): Promise<DayRows[]> {
  const { clock, roleBounds } = await readClock(db, owner);

  const [dayEntries, userKinds] = await Promise.all([
    db
      .select()
      .from(entries)
      .where(
        and(
          ownedBy(entries, owner),
          gte(entries.day, from),
          lte(entries.day, to),
          isNull(entries.deletedAt),
        ),
      ),
    readUserKinds(db, owner),
  ]);
  const ids = dayEntries.map((e) => e.id);
  const days: IsoDate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  const empty: DayRows = {
    day: from,
    clock,
    roleBounds,
    entries: [],
    values: [],
    lines: [],
    lineValues: [],
    sets: [],
    links: [],
    money: [],
    items: [],
    itemValues: [],
    userKinds,
  };
  if (ids.length === 0) return days.map((day) => ({ ...empty, day }));

  const [values, lines, sets, links, money] = await Promise.all([
    db
      .select()
      .from(entryValues)
      .where(and(ownedBy(entryValues, owner), inArray(entryValues.entryId, ids))),
    db
      .select()
      .from(entryLines)
      .where(and(ownedBy(entryLines, owner), inArray(entryLines.entryId, ids))),
    db
      .select()
      .from(trainingSets)
      .where(and(ownedBy(trainingSets, owner), inArray(trainingSets.entryId, ids))),
    db
      .select()
      .from(entryLinks)
      .where(and(ownedBy(entryLinks, owner), inArray(entryLinks.fromId, ids))),
    db
      .select()
      .from(moneyMovements)
      .where(and(ownedBy(moneyMovements, owner), inArray(moneyMovements.entryId, ids))),
  ]);

  const lineIds = lines.map((l) => l.id);
  const itemIds = [
    ...new Set(
      [
        ...dayEntries.map((e) => e.itemId),
        ...values.map((v) => v.refItemId),
        ...lines.map((l) => l.itemId),
        ...money.map((m) => m.categoryId),
      ].filter((x): x is string => x !== null),
    ),
  ];
  const [lineValues, items, itemValues] = await Promise.all([
    lineIds.length === 0
      ? Promise.resolve([])
      : db
          .select()
          .from(entryLineValues)
          .where(
            and(
              ownedBy(entryLineValues, owner),
              inArray(entryLineValues.lineId, lineIds),
            ),
          ),
    itemIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            id: catalogItems.id,
            catalog: catalogItems.catalog,
            name: catalogItems.name,
          })
          .from(catalogItems)
          .where(and(ownedBy(catalogItems, owner), inArray(catalogItems.id, itemIds))),
    itemIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            itemId: catalogValues.itemId,
            field: catalogValues.field,
            text: catalogValues.text,
          })
          .from(catalogValues)
          .where(
            and(
              ownedBy(catalogValues, owner),
              inArray(catalogValues.itemId, itemIds),
              inArray(catalogValues.field, [...DRAWING_FIELDS]),
            ),
          ),
  ]);

  const all = {
    ...empty,
    entries: dayEntries,
    values,
    lines,
    lineValues,
    sets,
    links,
    money,
    items,
    itemValues,
  };
  return days.length === 1
    ? [{ ...all, day: from }]
    : days.map((day) => splitDay(all, day));
}

/** One day's rows out of a range's: its entries and what hangs from them. */
function splitDay(all: DayRows, day: IsoDate): DayRows {
  const es = all.entries.filter((e) => e.day === day);
  const ids = new Set(es.map((e) => e.id));
  const lines = all.lines.filter((l) => ids.has(l.entryId));
  const lineIds = new Set(lines.map((l) => l.id));
  return {
    ...all,
    day,
    entries: es,
    values: all.values.filter((v) => ids.has(v.entryId)),
    lines,
    lineValues: all.lineValues.filter((v) => lineIds.has(v.lineId)),
    sets: all.sets.filter((x) => ids.has(x.entryId)),
    links: all.links.filter((x) => ids.has(x.fromId)),
    money: all.money.filter((x) => ids.has(x.entryId)),
  };
}
