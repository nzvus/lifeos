/**
 * core/plans/blocks.ts — blocchi as the Piano reads them (MOD-30, MOD-36, ADR-0062): a catalog
 * «block» whose what is its parts (one object, or a rotation's in order, PL-01, PL-02) or a type
 * with defaults (`kind`: an abitudine is a tracker's, PL-03), whose when is `when` / `at` /
 * `anchor` / `offsetMin` (PL-10) and whose how often is `recurrence` (the engine's, PL-20).
 * `readBlocks` turns his rows into `Block`s; `blocksOn` is the pure Piano of one day from them.
 */
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/db";
import { catalogItems, catalogParts, catalogValues } from "../db/schema";
import { plannedOn, type Recurrence } from "../engines/time/recurrence";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { AREAS, BLOCK_WHEN, type Area } from "../kinds/catalog";

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const recurrenceSchema: z.ZodType<Recurrence> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("daily") }),
  z.object({
    type: z.literal("weekdays"),
    days: z.array(z.number().int().min(1).max(7)).min(1),
  }),
  z.object({
    type: z.literal("everyN"),
    n: z.number().int().min(1).max(366),
    start: iso,
  }),
  z.object({ type: z.literal("timesPerWeek"), n: z.number().int().min(1).max(7) }),
  z.object({ type: z.literal("onDates"), dates: z.array(iso).min(1) }),
]);

/** A stored recurrence (JSON text) as the engine's, or null when it is not one. */
export function parseRecurrence(text: string | null | undefined): Recurrence | null {
  if (!text) return null;
  try {
    const r = recurrenceSchema.safeParse(JSON.parse(text));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

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
