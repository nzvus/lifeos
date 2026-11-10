/**
 * core/plans/blocks.ts — blocchi as the Piano reads them (MOD-30, MOD-36, ADR-0062): a catalog
 * «block» whose what is its parts (one object, or a rotation's in order, PL-01, PL-02) or a type
 * with defaults (`kind`: an abitudine is a tracker's, PL-03), whose when is `when` / `at` /
 * `anchor` / `offsetMin` (PL-10) and whose how often is `recurrence` (the engine's, PL-20).
 * `readBlocks` turns his rows into `Block`s; `blocksOn` is the pure Piano of one day from them.
 */
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogParts, catalogValues, kinds } from "../db/schema";
import { plannedOn, type Recurrence } from "../engines/time/recurrence";
import { parseRecurrence } from "../kinds/recurrence";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { ownsItem, textValues } from "./items";
import { BUILTIN_KINDS } from "../kinds/builtins";
import { AREAS, BLOCK_WHEN, type Area } from "../kinds/catalog";

export { parseRecurrence };

export type BlockWhen =
  | { kind: "none" }
  | { kind: "time"; atMin: number }
  | { kind: "after" | "before"; anchorId: string; offsetMin: number }
  | { kind: "wake" | "bed"; offsetMin: number };

export type BlockItem = { itemId: string; quantity: string | null };

export type Block = {
  id: string;
  name: string;
  area: Area;
  /** Its object, or a rotation's objects in order (PL-02); empty for a type with defaults. */
  items: BlockItem[];
  /** A type with defaults (a voce kind or his tracker), when it has no object (PL-01, PL-03). */
  kind: string | null;
  defaults: Record<string, unknown>;
  when: BlockWhen;
  durationMin: number | null;
  recurrence: Recurrence;
};

const hhmm = (s: string | undefined) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** A blocco's when from its values (PL-10); an incomplete one is «none» (PL-12 then decides). */
export function blockWhen(v: Readonly<Record<string, string | undefined>>): BlockWhen {
  const w = BLOCK_WHEN.find((x) => x === v["when"]);
  const off = Number(v["offsetMin"] ?? 0) || 0;
  if (w === "time") {
    const at = hhmm(v["at"]);
    return at === null ? { kind: "none" } : { kind: "time", atMin: at };
  }
  if (w === "after" || w === "before")
    return v["anchor"]
      ? { kind: w, anchorId: v["anchor"], offsetMin: off }
      : { kind: "none" };
  if (w === "wake" || w === "bed") return { kind: w, offsetMin: off };
  return { kind: "none" };
}

/** His live blocchi (not archived, not deleted), with what they hold. */
export async function readBlocks(db: Db, owner: Owner): Promise<Block[]> {
  const rows = await db
    .select({ id: catalogItems.id, name: catalogItems.name })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "block"),
        isNull(catalogItems.archivedAt),
        isNull(catalogItems.deletedAt),
      ),
    )
    .orderBy(catalogItems.name);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [values, parts] = await Promise.all([
    db
      .select({
        itemId: catalogValues.itemId,
        field: catalogValues.field,
        num: catalogValues.num,
        text: catalogValues.text,
        ref: catalogValues.refItemId,
      })
      .from(catalogValues)
      .where(and(ownedBy(catalogValues, owner), inArray(catalogValues.itemId, ids))),
    db
      .select({
        itemId: catalogParts.itemId,
        position: catalogParts.position,
        partItemId: catalogParts.partItemId,
        quantity: catalogParts.quantity,
      })
      .from(catalogParts)
      .where(and(ownedBy(catalogParts, owner), inArray(catalogParts.itemId, ids)))
      .orderBy(catalogParts.itemId, catalogParts.position),
  ]);
  const vals = new Map<string, Record<string, string | undefined>>();
  for (const v of values) {
    const m = vals.get(v.itemId) ?? {};
    m[v.field] = v.text ?? v.ref ?? (v.num === null ? undefined : String(Number(v.num)));
    vals.set(v.itemId, m);
  }
  return rows.flatMap((r) => {
    const v = vals.get(r.id) ?? {};
    const recurrence = parseRecurrence(v["recurrence"]);
    const area = AREAS.find((a) => a === v["area"]);
    if (!recurrence || !area) return [];
    let defaults: Record<string, unknown> = {};
    try {
      const d: unknown = v["defaults"] ? JSON.parse(v["defaults"]) : {};
      if (d && typeof d === "object" && !Array.isArray(d))
        defaults = d as Record<string, unknown>;
    } catch {
      defaults = {};
    }
    return [
      {
        id: r.id,
        name: r.name,
        area,
        items: parts
          .filter((p) => p.itemId === r.id)
          .map((p) => ({ itemId: p.partItemId, quantity: p.quantity })),
        kind: v["kind"] ?? null,
        defaults,
        when: blockWhen(v),
        durationMin: v["durationMin"] ? Number(v["durationMin"]) : null,
        recurrence,
      },
    ];
  });
}

export type BlockDue = { block: Block; itemId: string | null };

/**
 * The blocchi that fall on `day` (PL-40), each with the object it holds that day: a rotation
 * takes the item after the last one done by that blocco (PL-02; `lastDone`, by blocco id),
 * skipping items no longer live (`live`). A flexible frequency («3 volte a settimana») plans
 * no fixed day (PL-20).
 */
export function blocksOn(
  blocks: readonly Block[],
  day: IsoDate,
  lastDone: ReadonlyMap<string, string> = new Map(),
  live?: ReadonlySet<string>,
): BlockDue[] {
  return blocks
    .filter((b) => plannedOn(b.recurrence, day))
    .map((b) => {
      const items = live ? b.items.filter((i) => live.has(i.itemId)) : b.items;
      if (items.length === 0) return { block: b, itemId: null };
      const last = lastDone.get(b.id);
      const at = last ? items.findIndex((i) => i.itemId === last) : -1;
      return { block: b, itemId: items[(at + 1) % items.length]!.itemId };
    });
}

export type BlockWhat = {
  /** Its object, or a rotation's in order (PL-01, PL-02), each with its catalog and servings. */
  items: { id: string; name: string; catalog: string; quantity: string | null }[];
  /** A type with defaults instead (a voce kind or his tracker's key, PL-01, PL-03). */
  kind: string | null;
};

/** What one blocco of his holds, for its page and its Composer; null when it is not his. */
export async function readBlockWhat(
  db: Db,
  owner: Owner,
  id: string,
): Promise<BlockWhat | null> {
  if (!(await ownsItem(db, owner, id, "block"))) return null;
  const [items, kind] = await Promise.all([
    db
      .select({
        id: catalogParts.partItemId,
        name: catalogItems.name,
        catalog: catalogItems.catalog,
        quantity: catalogParts.quantity,
      })
      .from(catalogParts)
      .innerJoin(catalogItems, eq(catalogItems.id, catalogParts.partItemId))
      .where(and(ownedBy(catalogParts, owner), eq(catalogParts.itemId, id)))
      .orderBy(catalogParts.position),
    db
      .select({ text: catalogValues.text })
      .from(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          eq(catalogValues.itemId, id),
          eq(catalogValues.field, "kind"),
        ),
      ),
  ]);
  return { items, kind: kind[0]?.text ?? null };
}

export type BlockListRow = {
  id: string;
  name: string;
  area: string | null;
  recurrence: string | null;
};

/** His blocchi for Elenco (PL-70): live, or the archived ones; name, area and how often. */
export async function listBlocks(
  db: Db,
  owner: Owner,
  archived: boolean,
): Promise<BlockListRow[]> {
  const rows = await db
    .select({ id: catalogItems.id, name: catalogItems.name })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "block"),
        isNull(catalogItems.deletedAt),
        archived ? isNotNull(catalogItems.archivedAt) : isNull(catalogItems.archivedAt),
      ),
    )
    .orderBy(catalogItems.name);
  if (rows.length === 0) return [];
  const v = await textValues(
    db,
    owner,
    rows.map((r) => r.id),
    ["area", "recurrence"],
  );
  return rows.map((r) => ({
    ...r,
    area: v(r.id, "area"),
    recurrence: v(r.id, "recurrence"),
  }));
}

/** The catalog types a blocco may hold (PL-01): a pasto (or a variant), a scheda, a tragitto. */
export const BLOCK_OBJECTS = ["recipe", "routine", "route"] as const;

export type BlockWhatInput =
  { kind: string } | { items: readonly { id: string; quantity: number | null }[] };

/**
 * What a blocco holds, replaced (PL-01…03): one or more objects of his, in order, each with its
 * servings (several = a rotation, PL-02) — or one type (a built-in voce kind or his tracker).
 * The other one is cleared. «gone»: not his blocco; «invalid»: an object, a type or a quantity
 * that is not his or not one.
 */
export async function setBlockWhat(
  db: Db,
  owner: Owner,
  id: string,
  what: BlockWhatInput,
): Promise<"ok" | "gone" | "invalid"> {
  return db.transaction(async (tx) => {
    if (!(await ownsItem(tx, owner, id, "block"))) return "gone";
    if ("kind" in what) {
      const own = await tx
        .select({ key: kinds.key })
        .from(kinds)
        .where(and(ownedBy(kinds, owner), eq(kinds.key, what.kind)));
      if (!BUILTIN_KINDS.some((k) => k.key === what.kind) && own.length === 0)
        return "invalid";
    } else {
      const ids = what.items.map((x) => x.id);
      if (ids.length === 0 || new Set(ids).size !== ids.length) return "invalid";
      if (what.items.some((x) => x.quantity !== null && !(x.quantity > 0)))
        return "invalid";
      const mine = await tx
        .select({ id: catalogItems.id })
        .from(catalogItems)
        .where(
          and(
            ownedBy(catalogItems, owner),
            inArray(catalogItems.id, ids),
            inArray(catalogItems.catalog, [...BLOCK_OBJECTS]),
            isNull(catalogItems.deletedAt),
          ),
        );
      if (mine.length !== ids.length) return "invalid";
    }
    await tx
      .delete(catalogParts)
      .where(and(ownedBy(catalogParts, owner), eq(catalogParts.itemId, id)));
    await tx
      .delete(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          eq(catalogValues.itemId, id),
          inArray(catalogValues.field, ["kind", "defaults"]),
        ),
      );
    if ("kind" in what)
      await tx
        .insert(catalogValues)
        .values({ userId: owner.id, itemId: id, field: "kind", text: what.kind });
    else
      await tx.insert(catalogParts).values(
        what.items.map((x, position) => ({
          userId: owner.id,
          itemId: id,
          position,
          partItemId: x.id,
          quantity: x.quantity === null ? null : String(x.quantity),
        })),
      );
    return "ok";
  });
}
