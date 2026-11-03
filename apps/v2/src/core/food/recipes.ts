/**
 * core/food/recipes.ts — a composed meal saved as a recipe (V-04 «Salva
 * anche come pasto»): a catalog item `recipe` with its foods as parts, each
 * at the meal's quantity, its product kept as the preferred one. A line
 * whose food was never known (an old converted line) cannot be a part.
 * The name must be new among the person's live recipes (the catalog's
 * live-name index, ignoring case).
 * A typed estimate (a meal out: a burger menu, a pizza) is saved as a
 * recipe with no parts: its totals as values, typed at the estimate's
 * confidence and marked `estimate`, so logging it again is an estimate too.
 */
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { archiveItem } from "../catalog/archive";
import type { Db } from "../db/db";
import { catalogItems, catalogParts, catalogValues } from "../db/schema";
import type { CheckedLine } from "../entries";
import { ownedBy, type Owner } from "../identity/owner";
import { ESTIMATE_CONFIDENCE, ESTIMATE_FIELDS, type EstimateField } from "./meal";
import { basesOf, partsDiff, resolveParts, type Part } from "../catalog/family";

export type RecipeNameError = "empty" | "too_long" | "taken";
const NAME_MAX = 80;

/** Pure: the name as it will be kept, or why it cannot be. */
export function recipeName(
  raw: string,
): { ok: true; name: string } | { ok: false; error: RecipeNameError } {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name === "") return { ok: false, error: "empty" };
  if (name.length > NAME_MAX) return { ok: false, error: "too_long" };
  return { ok: true, name };
}

/** Whether a live recipe of this owner already has this name (ignoring case). */
export async function recipeNameTaken(
  db: Db,
  owner: Owner,
  name: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: catalogItems.id })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "recipe"),
        isNull(catalogItems.parentId),
        isNull(catalogItems.deletedAt),
        sql`lower(${catalogItems.name}) = lower(${name})`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Creates the recipe with its parts in one transaction; returns its id. */
export async function createRecipe(
  db: Db,
  owner: Owner,
  name: string,
  lines: readonly CheckedLine[],
  basedOnId: string | null = null,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog: "recipe", name, basedOnId })
      .returning({ id: catalogItems.id });
    const id = row!.id;
    await writeParts(tx as unknown as Db, owner, id, lines);
    return id;
  });
}

/** Checked lines as parts: food, quantity, unit, the product kept as preferred. */
const asParts = (lines: readonly CheckedLine[]): Part[] =>
  lines.flatMap((l) =>
    l.itemId
      ? [
          {
            partItemId: l.itemId,
            quantity: l.quantity,
            unit: l.unit,
            defaults: l.productId ? { preferredProduct: l.productId } : {},
          },
        ]
      : [],
  );

/**
 * A recipe's parts as stored. A variant (ADR-0060) stores only what differs
 * from its base's resolved parts (`partsDiff`); anything else stores them all.
 */
async function writeParts(
  db: Db,
  owner: Owner,
  id: string,
  lines: readonly CheckedLine[],
  base: readonly Part[] | null = null,
): Promise<void> {
  const wanted = asParts(lines);
  const parts = base ? partsDiff(base, wanted) : wanted;
  if (parts.length > 0)
    await db.insert(catalogParts).values(
      parts.map((x, position) => ({
        userId: owner.id,
        itemId: id,
        position,
        partItemId: x.partItemId,
        quantity: x.quantity,
        unit: x.unit,
        defaults: x.defaults,
      })),
    );
}

/** The resolved parts of a live recipe (its bases applied), or null when it is none. */
export async function resolvedParts(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Part[] | null> {
  const items = await db
    .select({ id: catalogItems.id, parentId: catalogItems.parentId })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "recipe"),
        isNull(catalogItems.deletedAt),
      ),
    );
  if (!items.some((i) => i.id === id)) return null;
  const family = new Map(items.map((i) => [i.id, { ...i, catalog: "recipe" }]));
  const ids = [id, ...basesOf(id, family)];
  const rows = await db
    .select()
    .from(catalogParts)
    .where(and(ownedBy(catalogParts, owner), inArray(catalogParts.itemId, ids)));
  const own = (x: string) =>
    rows
      .filter((r) => r.itemId === x)
      .sort((a, b) => a.position - b.position)
      .map((r) => ({
        partItemId: r.partItemId,
        quantity: r.quantity,
        unit: r.unit,
        defaults: (r.defaults ?? {}) as Record<string, unknown>,
      }));
  return resolveParts(id, family, own);
}

/** The base a recipe is a variant of (same catalog), or null. */
async function variantBase(db: Db, owner: Owner, id: string): Promise<string | null> {
  const [r] = await db
    .select({ parentId: catalogItems.parentId })
    .from(catalogItems)
    .where(and(ownedBy(catalogItems, owner), eq(catalogItems.id, id)));
  if (!r?.parentId) return null;
  const [up] = await db
    .select({ catalog: catalogItems.catalog })
    .from(catalogItems)
    .where(and(ownedBy(catalogItems, owner), eq(catalogItems.id, r.parentId)));
  return up?.catalog === "recipe" ? r.parentId : null;
}

/**
 * «+ Variante» (ADR-0060): a new recipe under `baseId` that stores only its
 * differences from the base; its id, "taken" for a used name, "gone" when
 * the base is not a live recipe of the owner.
 */
export async function createVariant(
  db: Db,
  owner: Owner,
  baseId: string,
  name: string,
  lines: readonly CheckedLine[],
): Promise<{ id: string } | "taken" | "gone"> {
  const base = await resolvedParts(db, owner, baseId);
  if (!base) return "gone";
  if (await recipeNameTaken(db, owner, name)) return "taken";
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog: "recipe", name, parentId: baseId })
      .returning({ id: catalogItems.id });
    await writeParts(tx as unknown as Db, owner, row!.id, lines, base);
    return { id: row!.id };
  });
}

/** A saved estimate's values: the mark and its typed totals at the estimate's confidence. */
async function writeEstimate(
  db: Db,
  owner: Owner,
  id: string,
  totals: Partial<Record<EstimateField, string>>,
): Promise<void> {
  await db.insert(catalogValues).values([
    { userId: owner.id, itemId: id, field: ESTIMATE_MARK, bool: true },
    ...ESTIMATE_FIELDS.flatMap((field) =>
      totals[field] === undefined
        ? []
        : [
            {
              userId: owner.id,
              itemId: id,
              field,
              num: totals[field],
              confidence: ESTIMATE_CONFIDENCE,
            },
          ],
    ),
  ]);
}

/**
 * A saved meal written again from the composer (ledger FOOD-42): its name,
 * then either its foods (parts, each with its preferred product) or, for an
 * estimate, its typed totals — the old ones replaced, either way. Meals
 * already logged keep their lines (ADR-0007). "taken" when another live
 * recipe has the name, "gone" when it is not a live recipe, "empty" with
 * no food that can be a part.
 */
export async function replaceRecipe(
  db: Db,
  owner: Owner,
  id: string,
  name: string,
  checked: { lines: readonly CheckedLine[]; estimate: boolean },
): Promise<"ok" | "gone" | "taken" | "empty"> {
  if (!checked.estimate && !checked.lines.some((l) => l.itemId)) return "empty";
  // A variant keeps storing only its differences from its base (ADR-0060).
  const baseId = await variantBase(db, owner, id);
  const base = baseId ? await resolvedParts(db, owner, baseId) : null;
  return db.transaction(async (tx) => {
    const [r] = await tx
      .select({ name: catalogItems.name })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.id, id),
          eq(catalogItems.catalog, "recipe"),
          isNull(catalogItems.deletedAt),
        ),
      )
      .for("update");
    if (!r) return "gone";
    if (
      r.name.toLowerCase() !== name.toLowerCase() &&
      (await recipeNameTaken(tx as unknown as Db, owner, name))
    )
      return "taken";
    await tx
      .update(catalogItems)
      .set({ name })
      .where(and(ownedBy(catalogItems, owner), eq(catalogItems.id, id)));
    await tx
      .delete(catalogParts)
      .where(and(ownedBy(catalogParts, owner), eq(catalogParts.itemId, id)));
    await tx
      .delete(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          eq(catalogValues.itemId, id),
          inArray(catalogValues.field, [ESTIMATE_MARK, ...ESTIMATE_FIELDS]),
        ),
      );
    if (checked.estimate)
      await writeEstimate(tx as unknown as Db, owner, id, checked.lines[0]!.per100);
    else await writeParts(tx as unknown as Db, owner, id, checked.lines, base);
    return "ok";
  });
}

/** The field marking a recipe as a saved estimate (its totals are values, not parts). */
export const ESTIMATE_MARK = "estimate";

/** Creates a saved estimate: the meal's typed totals, kcal at least; returns its id. */
export async function createEstimateRecipe(
  db: Db,
  owner: Owner,
  name: string,
  totals: Partial<Record<EstimateField, string>>,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog: "recipe", name })
      .returning({ id: catalogItems.id });
    const id = row!.id;
    await writeEstimate(tx as unknown as Db, owner, id, totals);
    return id;
  });
}

export type RecipeForEdit = {
  name: string;
  parts: {
    position: number;
    name: string;
    quantity: string | null;
    unit: string | null;
  }[];
};

/** A live recipe of this owner with its parts in order and their foods' names; null if none. */
export async function readRecipe(
  db: Db,
  owner: Owner,
  id: string,
): Promise<RecipeForEdit | null> {
  const [r] = await db
    .select({ name: catalogItems.name })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.id, id),
        eq(catalogItems.catalog, "recipe"),
        isNull(catalogItems.deletedAt),
        isNull(catalogItems.archivedAt),
      ),
    );
  if (!r) return null;
  const parts = await db
    .select({
      position: catalogParts.position,
      name: catalogItems.name,
      quantity: catalogParts.quantity,
      unit: catalogParts.unit,
    })
    .from(catalogParts)
    .innerJoin(
      catalogItems,
      and(
        eq(catalogItems.id, catalogParts.partItemId),
        eq(catalogItems.userId, catalogParts.userId),
      ),
    )
    .where(and(ownedBy(catalogParts, owner), eq(catalogParts.itemId, id)))
    .orderBy(asc(catalogParts.position));
  return { name: r.name, parts };
}

/** Archives the recipe: out of the lists and the composer; logged meals stay "of" it. */
export function archiveRecipe(db: Db, owner: Owner, id: string): Promise<boolean> {
  return archiveItem(db, owner, id, "recipe");
}
