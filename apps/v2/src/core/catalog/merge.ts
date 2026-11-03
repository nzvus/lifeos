/**
 * core/catalog/merge.ts — «Unisci» (capture.md §4, data-repair R5): two items
 * of one catalog that are the same thing (Run and Corsa) become one. Every
 * reference to the one that goes moves to the one kept (what was logged, the
 * routines and cycles, day models, other items pointing at it), so its history
 * continues on the kept one. The kept one takes the values it lacked and the
 * other's name as an alias; the other is archived with `mergedInto`, never
 * deleted. A recipe's own parts stay with it (they are its composition, not a
 * reference). One transaction, owned by the owner.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogParts,
  catalogValues,
  cycleStepItems,
  entries,
  entryLines,
  entryValues,
  priceObservations,
  templateBlocks,
} from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";

/** The names an item answers to besides its own, one per line. */
export const ALIASES = "aliases";
export const MERGED_INTO = "mergedInto";

export type MergeResult = {
  moved: { entries: number; lines: number; plans: number };
} | null;

/** How much would move: the summary the person reads before «Unisci». */
export async function mergePreview(
  db: Db,
  owner: Owner,
  goneId: string,
): Promise<{ entries: number; lines: number; plans: number }> {
  const count = async (q: Promise<{ n: number }[]>) => Number((await q)[0]?.n ?? 0);
  const n = sql<number>`count(*)`;
  const [e, l, c, t] = await Promise.all([
    count(
      db
        .select({ n })
        .from(entries)
        .where(
          and(
            ownedBy(entries, owner),
            eq(entries.itemId, goneId),
            isNull(entries.deletedAt),
          ),
        ),
    ),
    count(
      db
        .select({ n })
        .from(entryLines)
        .where(and(ownedBy(entryLines, owner), eq(entryLines.itemId, goneId))),
    ),
    count(
      db
        .select({ n })
        .from(cycleStepItems)
        .where(and(ownedBy(cycleStepItems, owner), eq(cycleStepItems.itemId, goneId))),
    ),
    count(
      db
        .select({ n })
        .from(templateBlocks)
        .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.itemId, goneId))),
    ),
  ]);
  return { entries: e, lines: l, plans: c + t };
}

export async function mergeItems(
  db: Db,
  owner: Owner,
  keepId: string,
  goneId: string,
): Promise<MergeResult> {
  if (keepId === goneId) return null;
  return db.transaction(async (tx) => {
    const both = await tx
      .select()
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          isNull(catalogItems.deletedAt),
          isNull(catalogItems.archivedAt),
          sql`${catalogItems.id} in (${keepId}, ${goneId})`,
        ),
      );
    const keep = both.find((i) => i.id === keepId);
    const gone = both.find((i) => i.id === goneId);
    if (!keep || !gone || keep.catalog !== gone.catalog) return null;
    const user = keep.userId;

    // Children both have with the same name (the brand «Mutti» under both foods, the
    // «500 g» under both brands) are one thing too: folded first, deepest first, or
    // moving the other's children would give a parent two of the same name (3 Nov,
    // «Possibili doppioni» failed on catalog_items_live_name_uq).
    const kids = await tx
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        catalog: catalogItems.catalog,
        parentId: catalogItems.parentId,
      })
      .from(catalogItems)
      .where(
        and(
          eq(catalogItems.userId, user),
          isNull(catalogItems.deletedAt),
          isNull(catalogItems.archivedAt),
          sql`${catalogItems.parentId} in (${keepId}, ${goneId})`,
        ),
      );
    for (const g of kids.filter((k) => k.parentId === goneId)) {
      const twin = kids.find(
        (k) =>
          k.parentId === keepId &&
          k.catalog === g.catalog &&
          k.name.toLowerCase() === g.name.toLowerCase(),
      );
      if (!twin) continue;
      await mergeItems(tx as unknown as Db, owner, twin.id, g.id);
      // Fully merged: out of the live names, so the parent's move below finds no clash.
      await tx
        .update(catalogItems)
        .set({ deletedAt: new Date() })
        .where(and(eq(catalogItems.userId, user), eq(catalogItems.id, g.id)));
    }

    // What points at it as a brand or a format: logged lines, prices, saved meals' brand.
    await tx
      .update(entryLines)
      .set({ productId: keepId })
      .where(and(eq(entryLines.userId, user), eq(entryLines.productId, goneId)));
    await tx
      .update(entryLines)
      .set({ formatId: keepId })
      .where(and(eq(entryLines.userId, user), eq(entryLines.formatId, goneId)));
    await tx
      .update(priceObservations)
      .set({ formatId: keepId })
      .where(
        and(eq(priceObservations.userId, user), eq(priceObservations.formatId, goneId)),
      );
    await tx
      .update(catalogParts)
      .set({
        defaults: sql`jsonb_set(${catalogParts.defaults}, '{preferredProduct}', ${JSON.stringify(keepId)}::jsonb)`,
      })
      .where(
        and(
          eq(catalogParts.userId, user),
          sql`${catalogParts.defaults}->>'preferredProduct' = ${goneId}`,
        ),
      );

    const moved = await tx
      .update(entries)
      .set({ itemId: keepId })
      .where(and(eq(entries.userId, user), eq(entries.itemId, goneId)))
      .returning({ id: entries.id });
    const lines = await tx
      .update(entryLines)
      .set({ itemId: keepId })
      .where(and(eq(entryLines.userId, user), eq(entryLines.itemId, goneId)))
      .returning({ id: entryLines.id });
    await tx
      .update(entryValues)
      .set({ refItemId: keepId })
      .where(and(eq(entryValues.userId, user), eq(entryValues.refItemId, goneId)));
    const steps = await tx
      .update(cycleStepItems)
      .set({ itemId: keepId })
      .where(and(eq(cycleStepItems.userId, user), eq(cycleStepItems.itemId, goneId)))
      .returning({ id: cycleStepItems.stepId });
    const blocks = await tx
      .update(templateBlocks)
      .set({ itemId: keepId })
      .where(and(eq(templateBlocks.userId, user), eq(templateBlocks.itemId, goneId)))
      .returning({ id: templateBlocks.id });
    // Other items using it (a recipe's ingredient, a reference value, a variant, «Parti da»).
    await tx
      .update(catalogParts)
      .set({ partItemId: keepId })
      .where(and(eq(catalogParts.userId, user), eq(catalogParts.partItemId, goneId)));
    await tx
      .update(catalogValues)
      .set({ refItemId: keepId })
      .where(and(eq(catalogValues.userId, user), eq(catalogValues.refItemId, goneId)));
    await tx
      .update(catalogItems)
      .set({ parentId: keepId })
      .where(and(eq(catalogItems.userId, user), eq(catalogItems.parentId, goneId)));
    await tx
      .update(catalogItems)
      .set({ basedOnId: keepId })
      .where(and(eq(catalogItems.userId, user), eq(catalogItems.basedOnId, goneId)));

    // The kept one takes the values it lacked (a guide, a pattern), then the other's names.
    const values = await tx
      .select()
      .from(catalogValues)
      .where(
        and(
          eq(catalogValues.userId, user),
          sql`${catalogValues.itemId} in (${keepId}, ${goneId})`,
        ),
      );
    const has = new Set(values.filter((v) => v.itemId === keepId).map((v) => v.field));
    const take = values.filter(
      (v) =>
        v.itemId === goneId &&
        !has.has(v.field) &&
        v.field !== ALIASES &&
        v.field !== MERGED_INTO,
    );
    if (take.length)
      await tx.insert(catalogValues).values(take.map((v) => ({ ...v, itemId: keepId })));
    const aliasesOf = (id: string) =>
      (values.find((v) => v.itemId === id && v.field === ALIASES)?.text ?? "")
        .split("\n")
        .filter(Boolean);
    const aliases = [
      ...new Set([...aliasesOf(keepId), gone.name, ...aliasesOf(goneId)]),
    ].filter((a) => a !== keep.name);
    await tx
      .insert(catalogValues)
      .values({ userId: user, itemId: keepId, field: ALIASES, text: aliases.join("\n") })
      .onConflictDoUpdate({
        target: [catalogValues.itemId, catalogValues.field],
        set: { text: aliases.join("\n") },
      });

    await tx
      .insert(catalogValues)
      .values({ userId: user, itemId: goneId, field: MERGED_INTO, refItemId: keepId })
      .onConflictDoUpdate({
        target: [catalogValues.itemId, catalogValues.field],
        set: { refItemId: keepId, text: null, num: null, bool: null },
      });
    await tx
      .update(catalogItems)
      .set({ archivedAt: new Date() })
      .where(and(eq(catalogItems.userId, user), eq(catalogItems.id, goneId)));
    return {
      moved: {
        entries: moved.length,
        lines: lines.length,
        plans: steps.length + blocks.length,
      },
    };
  });
}
