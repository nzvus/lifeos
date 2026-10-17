/**
 * core/food/recipes.ts — a composed meal saved as a recipe (V-04 «Salva
 * anche come pasto»): a catalog item `recipe` with its foods as parts, each
 * at the meal's quantity, its product kept as the preferred one. A line
 * whose food was never known (an old converted line) cannot be a part.
 * The name must be new among the person's live recipes (the catalog's
 * live-name index, ignoring case).
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogParts } from "../db/schema";
import type { CheckedLine } from "../entries";
import { ownedBy, type Owner } from "../identity/owner";

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
): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog: "recipe", name })
      .returning({ id: catalogItems.id });
    const id = row!.id;
    const parts = lines.flatMap((l) => (l.itemId ? [{ ...l, itemId: l.itemId }] : []));
    if (parts.length > 0)
      await tx.insert(catalogParts).values(
        parts.map((l, position) => ({
          userId: owner.id,
          itemId: id,
          position,
          partItemId: l.itemId,
          quantity: l.quantity,
          unit: l.unit,
          defaults: l.productId ? { preferredProduct: l.productId } : {},
        })),
      );
    return id;
  });
}
