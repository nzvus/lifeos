/**
 * core/convert/merge.ts — «Porta i dati da v1» (Impostazioni): from a v1
 * export converted whole, only what v2 does not have yet, never changing or
 * removing anything (ADR-0052's merge, narrowed to v1 → v2):
 * - an entry (with its children, values, lines, sets and links) comes in
 *   when v2 has no live entry of its kind on its day and not its id: a day's
 *   meals logged in v2 keep v2's, a day logged only in v1 comes whole;
 * - a catalog item it uses comes in when v2 has neither its id nor a live
 *   item of the same catalog, parent and name; with that name, the entry
 *   points at v2's item instead (ADR-0052: catalog identity is the name);
 *   a new item brings its parent, values and parts;
 * - a user kind it names comes in when v2 lacks the key;
 * - a movement brings its money, its lines and its receipt (when v2 lacks
 *   it); its category, account and products are catalog items as above;
 * - trashed rows stay out.
 * Pure: `readHave` brings what v2 holds; `loadFile` writes the result.
 */
import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { catalogItems, entries, kinds, receipts } from "../db/schema";
import { emptyTables, type V2File, type V2Tables } from "./file";

export type Have = {
  entryIds: ReadonlySet<string>;
  receiptIds: ReadonlySet<string>;
  /** "day|kind" of the live top-level entries. */
  dayKinds: ReadonlySet<string>;
  itemIds: ReadonlySet<string>;
  /** "catalog|parent|lower(name)" → the live item's id. */
  itemNames: ReadonlyMap<string, string>;
  kindKeys: ReadonlySet<string>;
};

export type MergeSummary = {
  /** Top-level entries added, by kind. */
  added: Record<string, number>;
  /** Top-level entries left out because v2 has that kind on that day, by kind. */
  kept: Record<string, number>;
  days: number;
  first: string | null;
  last: string | null;
  newItems: number;
  /** Items v2 already had by name: the entries use v2's. */
  byName: number;
  newKinds: number;
};

const nameKey = (catalog: unknown, parent: unknown, name: unknown) =>
  String(catalog) + "|" + String(parent ?? "") + "|" + String(name).toLowerCase();
const S = (v: unknown) => (v === null || v === undefined ? null : String(v));

export function newFromV1(
  file: V2File,
  have: Have,
): { file: V2File; summary: MergeSummary } {
  const t = file.tables;
  const out = emptyTables();
  const live = <R extends { deletedAt?: unknown }>(r: R) => !r.deletedAt;

  // Entries: the top-level ones v2 lacks, then their children (any depth).
  const added: Record<string, number> = {};
  const kept: Record<string, number> = {};
  const keep = new Set<string>();
  for (const e of t.entries) {
    if (e.parentId || !live(e)) continue;
    const id = String(e.id);
    if (have.entryIds.has(id)) continue;
    if (have.dayKinds.has(e.day + "|" + e.kind)) {
      kept[e.kind] = (kept[e.kind] ?? 0) + 1;
      continue;
    }
    keep.add(id);
    added[e.kind] = (added[e.kind] ?? 0) + 1;
  }
  for (let grew = true; grew;) {
    grew = false;
    for (const e of t.entries) {
      const id = String(e.id);
      if (keep.has(id) || !e.parentId || !live(e) || have.entryIds.has(id)) continue;
      if (keep.has(String(e.parentId))) {
        keep.add(id);
        grew = true;
      }
    }
  }
  out.entries = t.entries.filter((e) => keep.has(String(e.id)));
  out.entry_values = t.entry_values.filter((v) => keep.has(String(v.entryId)));
  out.entry_lines = t.entry_lines.filter((l) => keep.has(String(l.entryId)));
  const lineIds = new Set(out.entry_lines.map((l) => String(l.id)));
  out.entry_line_values = t.entry_line_values.filter((v) =>
    lineIds.has(String(v.lineId)),
  );
  out.training_sets = t.training_sets.filter((s) => keep.has(String(s.entryId)));
  const known = (id: unknown) => keep.has(String(id)) || have.entryIds.has(String(id));
  out.entry_links = t.entry_links.filter(
    (l) =>
      (keep.has(String(l.fromId)) || keep.has(String(l.toId))) &&
      known(l.fromId) &&
      known(l.toId),
  );

  // The catalog items they use: v2's by id, v2's by name, or new (with parents, values, parts).
  const items = new Map(t.catalog_items.map((i) => [String(i.id), i]));
  const remap = new Map<string, string>();
  const newItems = new Set<string>();
  let byName = 0;
  const to = (id: unknown) => {
    const k = S(id);
    return k === null ? null : (remap.get(k) ?? k);
  };
  const use = (id: unknown): void => {
    const k = S(id);
    if (!k || have.itemIds.has(k) || remap.has(k) || newItems.has(k)) return;
    const it = items.get(k);
    if (!it) return;
    if (it.parentId) use(it.parentId);
    const twin = have.itemNames.get(nameKey(it.catalog, to(it.parentId), it.name));
    if (twin && live(it)) {
      remap.set(k, twin);
      byName++;
      return;
    }
    newItems.add(k);
    for (const v of t.catalog_values) if (String(v.itemId) === k) use(v.refItemId);
    for (const p of t.catalog_parts) if (String(p.itemId) === k) use(p.partItemId);
  };
  for (const e of out.entries) use(e.itemId);
  for (const v of out.entry_values) use(v.refItemId);
  // A movement's money: its row, its lines, its receipt.
  out.money_movements = t.money_movements.filter((m) => keep.has(String(m.entryId)));
  const moves = new Set(out.money_movements.map((m) => String(m.entryId)));
  out.money_lines = t.money_lines.filter((l) => moves.has(String(l.movementId)));
  const wantReceipts = new Set(
    out.money_movements.flatMap((m) =>
      m.receiptId && !have.receiptIds.has(String(m.receiptId))
        ? [String(m.receiptId)]
        : [],
    ),
  );
  out.receipts = t.receipts.filter((r) => wantReceipts.has(String(r.id)));
  for (const m of out.money_movements) {
    use(m.categoryId);
    use(m.accountId);
  }
  for (const l of out.money_lines) use(l.productId);
  for (const l of out.entry_lines) {
    use(l.itemId);
    use(l.productId);
    use(l.formatId);
  }

  out.catalog_items = t.catalog_items
    .filter((i) => newItems.has(String(i.id)))
    .map((i) => ({
      ...i,
      parentId: to(i.parentId),
      // A copy's source v2 lacks is forgotten, not brought.
      basedOnId:
        i.basedOnId &&
        (have.itemIds.has(String(i.basedOnId)) || newItems.has(String(i.basedOnId)))
          ? to(i.basedOnId)
          : null,
    })) as V2Tables["catalog_items"];
  out.catalog_values = t.catalog_values
    .filter((v) => newItems.has(String(v.itemId)))
    .map((v) => ({ ...v, refItemId: to(v.refItemId) })) as V2Tables["catalog_values"];
  out.catalog_parts = t.catalog_parts
    .filter((p) => newItems.has(String(p.itemId)))
    .map((p) => ({ ...p, partItemId: to(p.partItemId) })) as V2Tables["catalog_parts"];
  out.entries = out.entries.map((e) => ({
    ...e,
    itemId: to(e.itemId),
  })) as V2Tables["entries"];
  out.entry_values = out.entry_values.map((v) => ({
    ...v,
    refItemId: to(v.refItemId),
  })) as V2Tables["entry_values"];
  out.money_movements = out.money_movements.map((m) => ({
    ...m,
    categoryId: to(m.categoryId),
    accountId: to(m.accountId),
  })) as V2Tables["money_movements"];
  out.money_lines = out.money_lines.map((l) => ({
    ...l,
    productId: to(l.productId),
    // A purchase v2 does not hold, or that does not come with it, is forgotten.
    purchaseEntryId:
      l.purchaseEntryId && known(l.purchaseEntryId) ? l.purchaseEntryId : null,
  })) as V2Tables["money_lines"];
  out.entry_lines = out.entry_lines.map((l) => ({
    ...l,
    itemId: to(l.itemId),
    productId: to(l.productId),
    formatId: to(l.formatId),
  })) as V2Tables["entry_lines"];

  // The user kinds the new entries name.
  const named = new Set(out.entries.map((e) => e.kind));
  out.kinds = t.kinds.filter((k) => named.has(k.key) && !have.kindKeys.has(k.key));

  const days = [
    ...new Set(out.entries.filter((e) => !e.parentId).map((e) => e.day)),
  ].sort();
  return {
    file: {
      ...file,
      tables: out,
      report: {
        ...file.report,
        counts: Object.fromEntries(
          Object.entries(out).map(([k, rows]) => [k, rows.length]),
        ) as V2File["report"]["counts"],
      },
    },
    summary: {
      added,
      kept,
      days: days.length,
      first: days[0] ?? null,
      last: days.at(-1) ?? null,
      newItems: newItems.size,
      byName,
      newKinds: out.kinds.length,
    },
  };
}

/** What v2 holds for the owner, as `newFromV1` compares it: ids, days and kinds, names. */
export async function readHave(
  db: PgDatabase<PgQueryResultHKT, Record<string, unknown>>,
  userId: string,
): Promise<Have> {
  const [e, i, k, r] = await Promise.all([
    db
      .select({
        id: entries.id,
        day: entries.day,
        kind: entries.kind,
        parentId: entries.parentId,
        deletedAt: entries.deletedAt,
      })
      .from(entries)
      .where(eq(entries.userId, userId)),
    db
      .select({
        id: catalogItems.id,
        catalog: catalogItems.catalog,
        parentId: catalogItems.parentId,
        name: catalogItems.name,
        deletedAt: catalogItems.deletedAt,
      })
      .from(catalogItems)
      .where(eq(catalogItems.userId, userId)),
    // Archived kinds too: a key is the owner's once, archived or not.
    db.select({ key: kinds.key }).from(kinds).where(eq(kinds.userId, userId)),
    db.select({ id: receipts.id }).from(receipts).where(eq(receipts.userId, userId)),
  ]);
  return {
    entryIds: new Set(e.map((x) => x.id)),
    receiptIds: new Set(r.map((x) => x.id)),
    dayKinds: new Set(
      e.filter((r) => !r.parentId && !r.deletedAt).map((r) => r.day + "|" + r.kind),
    ),
    itemIds: new Set(i.map((r) => r.id)),
    // Live items only: an entry never points at something in the trash.
    itemNames: new Map(
      i
        .filter((r) => !r.deletedAt)
        .map((r) => [nameKey(r.catalog, r.parentId, r.name), r.id]),
    ),
    kindKeys: new Set(k.map((r) => r.key)),
  };
}
