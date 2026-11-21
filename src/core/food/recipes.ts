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
import type { Db } from "../db/db";
import { catalogItems, catalogParts, catalogValues } from "../db/schema";
import type { CheckedLine } from "../entries";
import { ownedBy, type Owner } from "../identity/owner";
import { ESTIMATE_CONFIDENCE, ESTIMATE_FIELDS, type EstimateField } from "./meal";
import {
  nameTooLong,
  canBeVariant,
  partsDiff,
  resolveParts,
  type FamilyItem,
  type Part,
} from "../catalog/family";

export type RecipeNameError = "empty" | "too_long" | "taken";
/** Pure: the name as it will be kept, or why it cannot be; `current` is the name it has now. */
export function recipeName(
  raw: string,
  current?: string | null,
): { ok: true; name: string } | { ok: false; error: RecipeNameError } {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name === "") return { ok: false, error: "empty" };
  if (nameTooLong(name, current)) return { ok: false, error: "too_long" };
  return { ok: true, name };
}

/** Whether a live recipe of this owner already has this name (ignoring case). */
export async function recipeNameTaken(
  db: Db,
  owner: Owner,
  name: string,
): Promise<boolean> {
  return (await recipeIdByName(db, owner, name)) !== null;
}

/** His live pasto of that name (any case), or null: «Salva come giornata tipo» reuses it. */
export async function recipeIdByName(
  db: Db,
  owner: Owner,
  name: string,
): Promise<string | null> {
  const [row] = await db
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
  return row?.id ?? null;
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
  await insertParts(db, owner, id, base ? partsDiff(base, wanted) : wanted);
}

/** Parts stored in their order (a pasto with none yet). */
async function insertParts(db: Db, owner: Owner, id: string, parts: readonly Part[]) {
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

/**
 * Every live pasto of the owner as one family (ADR-0060): its items, each one's own parts as
 * stored, and `partsOf` — a pasto's parts with its variant bases applied (parent lines, MOD-23,
 * left as lines), null for an item that is not a pasto.
 */
export async function readRecipeFamily(db: Db, owner: Owner) {
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
  const family = new Map<string, FamilyItem>(
    items.map((i) => [i.id, { ...i, catalog: "recipe" }]),
  );
  const rows =
    items.length === 0
      ? []
      : await db
          .select()
          .from(catalogParts)
          .where(
            and(
              ownedBy(catalogParts, owner),
              inArray(
                catalogParts.itemId,
                items.map((i) => i.id),
              ),
            ),
          );
  const own = (x: string): Part[] =>
    rows
      .filter((r) => r.itemId === x)
      .sort((a, b) => a.position - b.position)
      .map((r) => ({
        partItemId: r.partItemId,
        quantity: r.quantity,
        unit: r.unit,
        defaults: (r.defaults ?? {}) as Record<string, unknown>,
      }));
  const partsOf = (id: string) => (family.has(id) ? resolveParts(id, family, own) : null);
  return { family, partsOf };
}

/** A pasto's parts written again, its old ones gone (inside the caller's transaction). */
export async function rewriteParts(
  db: Db,
  owner: Owner,
  id: string,
  parts: readonly Part[],
): Promise<void> {
  await db
    .delete(catalogParts)
    .where(and(ownedBy(catalogParts, owner), eq(catalogParts.itemId, id)));
  await insertParts(db, owner, id, parts);
}

/** The resolved parts of a live recipe (its bases applied), or null when it is none. */
export async function resolvedParts(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Part[] | null> {
  return (await readRecipeFamily(db, owner)).partsOf(id);
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

/**
 * «Variante di…» for a saved meal that already exists (ADR-0060, his 7 ice
 * creams): it keeps exactly its foods, now stored as differences from the
 * base, so a later change to the base reaches it. False when either is not a
 * live recipe, they are the same, or it would loop or go too deep.
 */
export async function makeVariantOf(
  db: Db,
  owner: Owner,
  childId: string,
  baseId: string,
): Promise<boolean> {
  if (childId === baseId) return false;
  const [mine, base] = await Promise.all([
    resolvedParts(db, owner, childId),
    resolvedParts(db, owner, baseId),
  ]);
  if (!mine || !base) return false;
  const { family } = await readRecipeFamily(db, owner);
  if (!canBeVariant(family.get(childId)!, family.get(baseId)!, family)) return false;
  const stored = partsDiff(base, mine);
  await db.transaction(async (tx) => {
    await tx
      .update(catalogItems)
      .set({ parentId: baseId })
      .where(and(ownedBy(catalogItems, owner), eq(catalogItems.id, childId)));
    await rewriteParts(tx as unknown as Db, owner, childId, stored);
  });
  return true;
}

/**
 * A pasto's food changed in place (his §169: «le quantità devono poter essere modificate… in
 * place»): `key` is the choice's key (`food` or `food:product`); a quantity sets it (adding the food
 * when it has none), null takes it out. A food that comes from a parent line is not its own: its
 * parent's multiplier or the parent itself changes it (MOD-23). A variant keeps storing only its
 * differences (ADR-0060). False when the pasto is not a live one of the owner, or the change is not
 * one (≤ 0 or over 5 kg, or a food it does not have to take out).
 */
export async function setRecipeFood(
  db: Db,
  owner: Owner,
  id: string,
  key: string,
  quantity: number | null,
): Promise<boolean> {
  const { family, partsOf } = await readRecipeFamily(db, owner);
  const mine = partsOf(id);
  const [food, product] = key.split(":") as [string, string | undefined];
  if (!mine || family.has(food)) return false;
  if (quantity !== null && !(quantity > 0 && quantity <= 5000)) return false;
  const at = mine.findIndex(
    (p) =>
      p.partItemId === food && (!product || p.defaults["preferredProduct"] === product),
  );
  const q = quantity === null ? null : String(+quantity.toFixed(2));
  let next: Part[];
  if (q === null) {
    if (at < 0) return false;
    next = mine.filter((_, i) => i !== at);
  } else if (at >= 0) next = mine.map((p, i) => (i === at ? { ...p, quantity: q } : p));
  else
    next = [
      ...mine,
      {
        partItemId: food,
        quantity: q,
        unit: null,
        defaults: product ? { preferredProduct: product } : {},
      },
    ];
  const baseId = family.get(id)?.parentId;
  const base = baseId && family.has(baseId) ? partsOf(baseId) : null;
  await db.transaction((tx) =>
    rewriteParts(tx as unknown as Db, owner, id, base ? partsDiff(base, next) : next),
  );
  return true;
}
