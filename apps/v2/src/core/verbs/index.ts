/**
 * core/verbs — every verb of patterns.md §2 as one function (PAT-24): `act(db, owner, verb,
 * type, id, payload)`, validated against the type's declaration in the registry (MOD-01), through
 * identity-taking queries (ADR-0057). No feature writes its own archive, delete or merge again.
 *
 * Each result carries its **undo**: the verb that reverts it exactly (archive ↔ restore, create →
 * delete, edit → the previous values, trash → restore). The kit's Toast calls `act` with it within
 * 5 s (PAT-21), so «Annulla» needs no change log. A verb that cannot be undone (merge) answers
 * `undo: null`, and its screen asks first (PAT-73).
 *
 * Phase 3 builds the generic part only: names, declared fields, parts, family links. A type's
 * specialised values (nutrients, sets) stay in its folder (model.md §8); trackers (stored in
 * `kinds`) get archive and restore here, the rest of their verbs when they move (phase 4).
 */
import { and, asc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogParts,
  catalogValues,
  entries,
  entryLines,
  kinds,
} from "../db/schema";
import { mergeItems, mergePreview } from "../catalog/merge";
import { restoreEntry, trashEntry } from "../entries/write";
import { ownedBy, type Owner } from "../identity/owner";
import { catalogType, valuesSchema, type CatalogType, type Verb } from "../kinds/catalog";
import { BUILTIN_KINDS } from "../kinds/builtins";

export type Values = Record<string, string | number | boolean | null>;

export type Payloads = {
  create: { name: string; values?: Values; parentId?: string | null };
  startFrom: { name: string };
  variant: { name: string };
  edit: { name?: string; values?: Values };
  /** `id` is the one that goes; `into` the one that stays. */
  merge: { into: string };
  archive: Record<string, never>;
  restore: Record<string, never>;
  trash: Record<string, never>;
  delete: Record<string, never>;
  /** `type` is the catalog type made, `id` the voce it is made from (MOD-14). */
  saveAs: { name: string };
};
export type ActVerb = keyof Payloads;

/** What `act` runs to revert a verb: the Toast keeps it for 5 s (PAT-21). */
export type Undo = {
  [V in ActVerb]: { verb: V; type: string; id: string; payload: Payloads[V] };
}[ActVerb];

export type Refusal =
  "unknown_type" | "verb_not_allowed" | "invalid" | "not_found" | "name_taken" | "in_use";

export type VerbResult =
  | { ok: true; id: string; undo: Undo | null }
  | { ok: false; refused: Refusal; detail?: string; offer?: Verb };

const VOCE_KINDS = new Set(BUILTIN_KINDS.map((k) => k.key));
const NO: Record<string, never> = {};
const refuse = (refused: Refusal, detail?: string, offer?: Verb): VerbResult => ({
  ok: false,
  refused,
  ...(detail ? { detail } : {}),
  ...(offer ? { offer } : {}),
});
const done = (id: string, undo: Undo | null): VerbResult => ({ ok: true, id, undo });

/** One verb on one thing (PAT-24). `type` is a registry key: a catalog type or a voce kind. */
export async function act<V extends ActVerb>(
  db: Db,
  owner: Owner,
  verb: V,
  type: string,
  id: string | null,
  payload: Payloads[V],
): Promise<VerbResult> {
  const t = catalogType(type);
  if (!t) {
    if (!VOCE_KINDS.has(type)) return refuse("unknown_type", type);
    return actOnVoce(db, owner, verb, type, id);
  }
  if (!t.verbs.includes(verb) && !isInverse(verb, t))
    return refuse("verb_not_allowed", verb);
  if (t.storage.table === "kinds") return actOnTracker(db, owner, verb, t, id);
  if (verb === "create") return create(db, owner, t, payload as Payloads["create"]);
  if (verb === "saveAs") return saveAs(db, owner, t, id, payload as Payloads["saveAs"]);
  const item = id ? await readItem(db, owner, t, id) : null;
  if (!item || (item.deletedAt && verb !== "restore")) return refuse("not_found");
  switch (verb) {
    case "startFrom":
      return startFrom(db, owner, t, item, payload as Payloads["startFrom"]);
    case "variant":
      return variant(db, owner, t, item, payload as Payloads["variant"]);
    case "edit":
      return edit(db, owner, t, item, payload as Payloads["edit"]);
    case "merge":
      return merge(db, owner, t, item, payload as Payloads["merge"]);
    case "archive":
      return setState(db, owner, t, item, { archivedAt: new Date() }, "restore");
    case "restore":
      return setState(
        db,
        owner,
        t,
        item,
        { archivedAt: null, deletedAt: null },
        item.deletedAt ? "delete" : item.archivedAt ? "archive" : null,
      );
    case "delete":
      return remove(db, owner, t, item);
    default:
      return refuse("verb_not_allowed", verb);
  }
}

/** «Annulla» (PAT-21): the undo a verb returned, run as a verb. */
export function undo(db: Db, owner: Owner, u: Undo): Promise<VerbResult> {
  return act(db, owner, u.verb, u.type, u.id, u.payload);
}

/** An undo may run a verb the type does not offer on screen (create → delete of a pasto). */
const isInverse = (verb: ActVerb, t: CatalogType) =>
  (verb === "delete" && (t.verbs.includes("create") || t.verbs.includes("startFrom"))) ||
  (verb === "restore" && (t.verbs.includes("archive") || t.verbs.includes("delete")));

type Item = typeof catalogItems.$inferSelect;

async function readItem(
  db: Db,
  owner: Owner,
  t: CatalogType,
  id: string,
): Promise<Item | null> {
  if (t.storage.table !== "catalog_items") return null;
  const [row] = await db
    .select()
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.id, id),
        eq(catalogItems.catalog, t.storage.catalog),
      ),
    );
  if (!row) return null;
  if (t.storage.flag) {
    const [flag] = await db
      .select({ bool: catalogValues.bool })
      .from(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          eq(catalogValues.itemId, id),
          eq(catalogValues.field, t.storage.flag),
        ),
      );
    if (flag?.bool !== true) return null;
  }
  return row;
}

/** One live name per catalog and parent (catalog_items_live_name_uq), asked before writing. */
async function nameTaken(
  db: Db,
  owner: Owner,
  catalog: string,
  parentId: string | null,
  name: string,
  except?: string,
) {
  const rows = await db
    .select({ id: catalogItems.id })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, catalog),
        parentId ? eq(catalogItems.parentId, parentId) : isNull(catalogItems.parentId),
        sql`lower(${catalogItems.name}) = lower(${name})`,
        isNull(catalogItems.deletedAt),
      ),
    );
  return rows.some((r) => r.id !== except);
}

const cleanName = (name: unknown) => (typeof name === "string" ? name.trim() : "");

const asColumns = (v: string | number | boolean) =>
  typeof v === "number"
    ? { num: String(v) }
    : typeof v === "boolean"
      ? { bool: v }
      : { text: v };

async function writeValues(tx: Db, owner: Owner, itemId: string, values: Values) {
  for (const [field, v] of Object.entries(values)) {
    await tx
      .delete(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          eq(catalogValues.itemId, itemId),
          eq(catalogValues.field, field),
        ),
      );
    if (v !== null && v !== "")
      await tx
        .insert(catalogValues)
        .values({ userId: owner.id, itemId, field, ...asColumns(v) });
  }
}

async function readValues(
  db: Db,
  owner: Owner,
  itemId: string,
  fields: string[],
): Promise<Values> {
  const rows = fields.length
    ? await db
        .select()
        .from(catalogValues)
        .where(
          and(
            ownedBy(catalogValues, owner),
            eq(catalogValues.itemId, itemId),
            inArray(catalogValues.field, fields),
          ),
        )
    : [];
  const out: Values = Object.fromEntries(fields.map((f) => [f, null]));
  for (const r of rows)
    out[r.field] = r.num !== null ? Number(r.num) : (r.bool ?? r.text ?? null);
  return out;
}

async function create(
  db: Db,
  owner: Owner,
  t: CatalogType,
  p: Payloads["create"],
): Promise<VerbResult> {
  if (t.storage.table !== "catalog_items") return refuse("verb_not_allowed");
  const name = cleanName(p?.name);
  const values = valuesSchema(t).safeParse(p?.values ?? {});
  if (!name || name.length > 120 || !values.success)
    return refuse("invalid", values.error?.message);
  if (t.fields.some((f) => f.required && (p.values?.[f.key] ?? null) === null))
    return refuse("invalid", "required");
  const parentId = p.parentId ?? null;
  if (t.family.rule === "levels" && t.family.parent) {
    const parentType = catalogType(t.family.parent);
    if (!parentId || !parentType || !(await readItem(db, owner, parentType, parentId)))
      return refuse("invalid", "parent");
  } else if (parentId) return refuse("invalid", "parent");
  const { catalog, flag } = t.storage;
  if (await nameTaken(db, owner, catalog, parentId, name)) return refuse("name_taken");
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog, name, parentId })
      .returning({ id: catalogItems.id });
    await writeValues(tx as unknown as Db, owner, row!.id, {
      ...(values.data as Values),
      ...(flag ? { [flag]: true } : {}),
    });
    return row!.id;
  });
  return done(id, { verb: "delete", type: t.key, id, payload: NO });
}

/** «Parti da…» (PAT-16): a new object based on it, its values and parts copied, `basedOnId` kept. */
async function startFrom(
  db: Db,
  owner: Owner,
  t: CatalogType,
  from: Item,
  p: Payloads["startFrom"],
): Promise<VerbResult> {
  const name = cleanName(p?.name);
  if (!name) return refuse("invalid", "name");
  if (await nameTaken(db, owner, from.catalog, from.parentId, name))
    return refuse("name_taken");
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(catalogItems)
      .values({
        userId: owner.id,
        catalog: from.catalog,
        name,
        parentId: from.parentId,
        basedOnId: from.id,
      })
      .returning({ id: catalogItems.id });
    const values = await tx
      .select()
      .from(catalogValues)
      .where(and(ownedBy(catalogValues, owner), eq(catalogValues.itemId, from.id)));
    if (values.length)
      await tx
        .insert(catalogValues)
        .values(values.map((v) => ({ ...v, itemId: row!.id })));
    const parts = await tx
      .select()
      .from(catalogParts)
      .where(and(ownedBy(catalogParts, owner), eq(catalogParts.itemId, from.id)));
    if (parts.length)
      await tx.insert(catalogParts).values(parts.map((v) => ({ ...v, itemId: row!.id })));
    return row!.id;
  });
  return done(id, { verb: "delete", type: t.key, id, payload: NO });
}

/** «Variante» (PAT-17): a child of the same catalog that stores only its differences (none yet). */
async function variant(
  db: Db,
  owner: Owner,
  t: CatalogType,
  base: Item,
  p: Payloads["variant"],
): Promise<VerbResult> {
  const name = cleanName(p?.name);
  if (!name) return refuse("invalid", "name");
  if (await nameTaken(db, owner, base.catalog, base.id, name))
    return refuse("name_taken");
  const [row] = await db
    .insert(catalogItems)
    .values({ userId: owner.id, catalog: base.catalog, name, parentId: base.id })
    .returning({ id: catalogItems.id });
  return done(row!.id, { verb: "delete", type: t.key, id: row!.id, payload: NO });
}

/** «Modifica» in place (PAT-13): the name and declared values; the undo holds the previous ones. */
async function edit(
  db: Db,
  owner: Owner,
  t: CatalogType,
  item: Item,
  p: Payloads["edit"],
): Promise<VerbResult> {
  const values = valuesSchema(t).safeParse(p?.values ?? {});
  if (!values.success) return refuse("invalid", values.error.message);
  const name = p?.name === undefined ? undefined : cleanName(p.name);
  if (name === "") return refuse("invalid", "name");
  if (name && (await nameTaken(db, owner, item.catalog, item.parentId, name, item.id)))
    return refuse("name_taken");
  const before = await readValues(db, owner, item.id, Object.keys(values.data));
  await db.transaction(async (tx) => {
    if (name)
      await tx
        .update(catalogItems)
        .set({ name })
        .where(and(ownedBy(catalogItems, owner), eq(catalogItems.id, item.id)));
    await writeValues(tx as unknown as Db, owner, item.id, values.data as Values);
  });
  return done(item.id, {
    verb: "edit",
    type: t.key,
    id: item.id,
    payload: { ...(name ? { name: item.name } : {}), values: before },
  });
}

/** «Unisci» (PAT-18): cannot be undone, so the screen confirms first (PAT-73). */
async function merge(
  db: Db,
  owner: Owner,
  t: CatalogType,
  gone: Item,
  p: Payloads["merge"],
): Promise<VerbResult> {
  const keep = p?.into ? await readItem(db, owner, t, p.into) : null;
  if (!keep) return refuse("not_found", "into");
  const r = await mergeItems(db, owner, keep.id, gone.id);
  return r ? done(keep.id, null) : refuse("invalid", "merge");
}

async function setState(
  db: Db,
  owner: Owner,
  t: CatalogType,
  item: Item,
  set: { archivedAt?: Date | null; deletedAt?: Date | null },
  inverse: "restore" | "archive" | "delete" | null,
): Promise<VerbResult> {
  await db
    .update(catalogItems)
    .set(set)
    .where(and(ownedBy(catalogItems, owner), eq(catalogItems.id, item.id)));
  return done(
    item.id,
    inverse ? { verb: inverse, type: t.key, id: item.id, payload: NO } : null,
  );
}

/** «Elimina» an object (PAT-20): only if nothing uses it; otherwise Archivia is offered. */
async function remove(
  db: Db,
  owner: Owner,
  t: CatalogType,
  item: Item,
): Promise<VerbResult> {
  if (item.deletedAt) return refuse("not_found");
  const used = await mergePreview(db, owner, item.id);
  const [child] = await db
    .select({ id: catalogItems.id })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.parentId, item.id),
        isNull(catalogItems.deletedAt),
      ),
    )
    .limit(1);
  const [part] = await db
    .select({ id: catalogParts.itemId })
    .from(catalogParts)
    .where(and(ownedBy(catalogParts, owner), eq(catalogParts.partItemId, item.id)))
    .limit(1);
  if (used.entries + used.lines + used.plans > 0 || child || part)
    return refuse("in_use", undefined, "archive");
  return setState(db, owner, t, item, { deletedAt: new Date() }, "restore");
}

/** «Salva come …» (MOD-14): a voce's lines or children become the parts of a new object. */
async function saveAs(
  db: Db,
  owner: Owner,
  t: CatalogType,
  voceId: string | null,
  p: Payloads["saveAs"],
): Promise<VerbResult> {
  if (!t.savedFrom || t.storage.table !== "catalog_items" || !voceId)
    return refuse("verb_not_allowed");
  const name = cleanName(p?.name);
  if (!name) return refuse("invalid", "name");
  const [voce] = await db
    .select({ id: entries.id, kind: entries.kind })
    .from(entries)
    .where(
      and(ownedBy(entries, owner), eq(entries.id, voceId), isNull(entries.deletedAt)),
    );
  if (!voce || voce.kind !== t.savedFrom.kind) return refuse("not_found");
  const parts =
    t.savedFrom.parts === "lines"
      ? await db
          .select({
            partItemId: entryLines.itemId,
            quantity: entryLines.quantity,
            unit: entryLines.unit,
          })
          .from(entryLines)
          .where(
            and(
              ownedBy(entryLines, owner),
              eq(entryLines.entryId, voceId),
              isNotNull(entryLines.itemId),
            ),
          )
          .orderBy(asc(entryLines.position))
      : (
          await db
            .select({ partItemId: entries.itemId })
            .from(entries)
            .where(
              and(
                ownedBy(entries, owner),
                eq(entries.parentId, voceId),
                isNull(entries.deletedAt),
                isNotNull(entries.itemId),
              ),
            )
            .orderBy(asc(entries.startAt), asc(entries.createdAt))
        ).map((r) => ({ ...r, quantity: null, unit: null }));
  if (await nameTaken(db, owner, t.storage.catalog, null, name))
    return refuse("name_taken");
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(catalogItems)
      .values({
        userId: owner.id,
        catalog: t.storage.table === "catalog_items" ? t.storage.catalog : "",
        name,
      })
      .returning({ id: catalogItems.id });
    if (parts.length)
      await tx.insert(catalogParts).values(
        parts.map((part, position) => ({
          userId: owner.id,
          itemId: row!.id,
          position,
          partItemId: part.partItemId!,
          quantity: part.quantity,
          unit: part.unit,
        })),
      );
    return row!.id;
  });
  return done(id, { verb: "delete", type: t.key, id, payload: NO });
}

/** A voce: «Elimina» goes to the trash with its children; «Ripristina» brings them back. */
async function actOnVoce(
  db: Db,
  owner: Owner,
  verb: ActVerb,
  kind: string,
  id: string | null,
): Promise<VerbResult> {
  if (!id) return refuse("not_found");
  const [row] = await db
    .select({ kind: entries.kind })
    .from(entries)
    .where(and(ownedBy(entries, owner), eq(entries.id, id)));
  if (!row || row.kind !== kind) return refuse("not_found");
  if (verb === "trash" || verb === "delete")
    return (await trashEntry(db, owner, id))
      ? done(id, { verb: "restore", type: kind, id, payload: NO })
      : refuse("not_found");
  if (verb === "restore")
    return (await restoreEntry(db, owner, id))
      ? done(id, { verb: "trash", type: kind, id, payload: NO })
      : refuse("not_found");
  return refuse("verb_not_allowed", verb);
}

/** A tracker (a `kinds` row): archive and restore here; its other verbs move in phase 4. */
async function actOnTracker(
  db: Db,
  owner: Owner,
  verb: ActVerb,
  t: CatalogType,
  id: string | null,
): Promise<VerbResult> {
  if (!id || (verb !== "archive" && verb !== "restore"))
    return refuse("verb_not_allowed", verb);
  const rows = await db
    .update(kinds)
    .set({ archivedAt: verb === "archive" ? new Date() : null })
    .where(and(ownedBy(kinds, owner), eq(kinds.id, id)))
    .returning({ id: kinds.id });
  if (!rows.length) return refuse("not_found");
  return done(
    id,
    verb === "archive" ? { verb: "restore", type: t.key, id, payload: NO } : null,
  );
}
