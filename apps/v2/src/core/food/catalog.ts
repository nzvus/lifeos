/**
 * core/food/catalog.ts — the composer's choices read for an owner (V-04):
 * live foods and products, their values, their use in the last 90 days;
 * `choices.ts` makes them choices.
 *
 * The snapshot a line keeps (ADR-0007) is taken from here, on the server:
 * never from values a client sends.
 */
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogParts,
  catalogValues,
  entries,
  entryLines,
} from "../db/schema";
import { addDays, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import {
  foodChoices,
  recipeChoices,
  SNAPSHOT_FIELDS,
  USE_DAYS,
  type FoodChoice,
  type RecipeChoice,
} from "./choices";
import { FIBRE_TYPES, KIND_FIELDS } from "./kinds";
import { ESTIMATE_FIELDS } from "./meal";
import { MICRO_FIELDS } from "./micros";
import { ESTIMATE_MARK } from "./recipes";

/** The owner's live foods and products as choices, with their use up to `today`. */
export async function readFoodChoices(
  db: Db,
  owner: Owner,
  today: IsoDate,
): Promise<FoodChoice[]> {
  const items = await db
    .select({
      id: catalogItems.id,
      catalog: catalogItems.catalog,
      name: catalogItems.name,
      parentId: catalogItems.parentId,
    })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        inArray(catalogItems.catalog, ["food", "product"]),
        isNull(catalogItems.deletedAt),
        isNull(catalogItems.archivedAt),
      ),
    );
  if (items.length === 0) return [];
  const [values, uses] = await Promise.all([
    db
      .select({
        itemId: catalogValues.itemId,
        field: catalogValues.field,
        num: catalogValues.num,
        text: catalogValues.text,
      })
      .from(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          inArray(
            catalogValues.itemId,
            items.map((i) => i.id),
          ),
          inArray(catalogValues.field, [
            ...SNAPSHOT_FIELDS,
            ...KIND_FIELDS,
            FIBRE_TYPES,
            "unit",
          ]),
        ),
      ),
    db
      .select({
        itemId: entryLines.itemId,
        productId: entryLines.productId,
        uses: sql<number>`count(*)::int`,
        lastQty: sql<
          string | null
        >`(array_agg(${entryLines.quantity}::text order by ${entries.day} desc, ${entries.startAt} desc nulls last))[1]`,
      })
      .from(entryLines)
      .innerJoin(
        entries,
        and(eq(entries.id, entryLines.entryId), eq(entries.userId, entryLines.userId)),
      )
      .where(
        and(
          ownedBy(entryLines, owner),
          eq(entries.kind, "meal"),
          eq(entries.status, "done"),
          isNull(entries.deletedAt),
          gte(entries.day, addDays(today, -USE_DAYS)),
        ),
      )
      .groupBy(entryLines.itemId, entryLines.productId)
      .orderBy(desc(sql`count(*)`)),
  ]);
  return foodChoices(
    items,
    values,
    uses.flatMap((u) => (u.itemId === null ? [] : [{ ...u, itemId: u.itemId }])),
  );
}

/** The owner's live recipes as choices over `foods`, with how often each was logged in 90 days. */
export async function readRecipeChoices(
  db: Db,
  owner: Owner,
  today: IsoDate,
  foods: readonly FoodChoice[],
): Promise<RecipeChoice[]> {
  const recipes = await db
    .select({ id: catalogItems.id, name: catalogItems.name })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "recipe"),
        isNull(catalogItems.deletedAt),
        isNull(catalogItems.archivedAt),
      ),
    );
  if (recipes.length === 0) return [];
  const ids = recipes.map((r) => r.id);
  const [parts, uses, values] = await Promise.all([
    db
      .select({
        itemId: catalogParts.itemId,
        position: catalogParts.position,
        partItemId: catalogParts.partItemId,
        quantity: catalogParts.quantity,
        defaults: catalogParts.defaults,
      })
      .from(catalogParts)
      .where(and(ownedBy(catalogParts, owner), inArray(catalogParts.itemId, ids))),
    db
      .select({ itemId: entries.itemId, uses: sql<number>`count(*)::int` })
      .from(entries)
      .where(
        and(
          ownedBy(entries, owner),
          eq(entries.kind, "meal"),
          eq(entries.status, "done"),
          isNull(entries.deletedAt),
          inArray(entries.itemId, ids),
          gte(entries.day, addDays(today, -USE_DAYS)),
        ),
      )
      .groupBy(entries.itemId),
    db
      .select({
        itemId: catalogValues.itemId,
        field: catalogValues.field,
        num: catalogValues.num,
        bool: catalogValues.bool,
      })
      .from(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          inArray(catalogValues.itemId, ids),
          inArray(catalogValues.field, [ESTIMATE_MARK, ...ESTIMATE_FIELDS]),
        ),
      ),
  ]);
  return recipeChoices(
    recipes,
    parts,
    new Map(uses.flatMap((u) => (u.itemId ? [[u.itemId, u.uses] as const] : []))),
    foods,
    savedEstimates(values),
  );
}

/** Pure: the saved estimates' totals by recipe; a recipe without the mark is none. */
export function savedEstimates(
  rows: readonly {
    itemId: string;
    field: string;
    num: string | null;
    bool: boolean | null;
  }[],
): Map<string, Record<string, string>> {
  const marked = new Set(
    rows.filter((r) => r.field === ESTIMATE_MARK && r.bool).map((r) => r.itemId),
  );
  const out = new Map<string, Record<string, string>>();
  for (const id of marked) out.set(id, {});
  for (const r of rows)
    if (marked.has(r.itemId) && r.field !== ESTIMATE_MARK && r.num !== null)
      out.get(r.itemId)![r.field] = r.num;
  return out;
}

/** The estimates of these foods (core/food/kinds and micros), by food: for the lines of a day. */
export async function readFoodEstimates(
  db: Db,
  owner: Owner,
  itemIds: readonly string[],
): Promise<Map<string, Record<string, string>>> {
  const out = new Map<string, Record<string, string>>();
  if (itemIds.length === 0) return out;
  const rows = await db
    .select({
      itemId: catalogValues.itemId,
      field: catalogValues.field,
      num: catalogValues.num,
      text: catalogValues.text,
    })
    .from(catalogValues)
    .where(
      and(
        ownedBy(catalogValues, owner),
        inArray(catalogValues.itemId, [...new Set(itemIds)]),
        inArray(catalogValues.field, [...KIND_FIELDS, FIBRE_TYPES, ...MICRO_FIELDS]),
      ),
    );
  for (const r of rows) {
    const v = r.field === FIBRE_TYPES ? r.text : r.num;
    if (v) out.set(r.itemId, { ...out.get(r.itemId), [r.field]: v });
  }
  return out;
}
