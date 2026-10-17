/**
 * core/food/edit.ts — a food's editor (V-07): its name and its values per
 * 100. Only the values changed are written, as typed (source "typed",
 * confidence 1); the others keep their provenance. An emptied value is
 * removed. Logged meals keep their snapshot (ADR-0007): only what is
 * logged from now on reads the new values.
 */
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogValues } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { SNAPSHOT_FIELDS } from "./choices";
import { recipeName, type RecipeNameError } from "./recipes";

export type FoodField = (typeof SNAPSHOT_FIELDS)[number];
export type FoodValueError = "number" | "too_much" | "nova";
const MAX: Record<FoodField, number> = {
  kcal: 900,
  protein: 100,
  carbs: 100,
  sugars: 100,
  fat: 100,
  saturatedFat: 100,
  fibre: 100,
  salt: 100,
  nova: 4,
};

/** Pure: the typed name and values, checked; "" means no value. */
export function checkFood(
  name: string,
  typed: Partial<Record<FoodField, string>>,
):
  | { ok: true; name: string; values: Partial<Record<FoodField, string>> }
  | {
      ok: false;
      name?: RecipeNameError;
      at: Partial<Record<FoodField, FoodValueError>>;
    } {
  const n = recipeName(name);
  const at: Partial<Record<FoodField, FoodValueError>> = {};
  const values: Partial<Record<FoodField, string>> = {};
  for (const f of SNAPSHOT_FIELDS) {
    const raw = (typed[f] ?? "").trim().replace(",", ".");
    if (raw === "") continue;
    if (f === "nova") {
      if (!/^[1-4]$/.test(raw)) at[f] = "nova";
      else values[f] = raw;
    } else if (!/^\d+(\.\d{1,4})?$/.test(raw)) at[f] = "number";
    else if (Number(raw) > MAX[f]) at[f] = "too_much";
    else values[f] = raw;
  }
  if (!n.ok || Object.keys(at).length > 0)
    return { ok: false, ...(n.ok ? {} : { name: n.error }), at };
  return { ok: true, name: n.name, values };
}

/** Pure: which stored values change, given the stored and the typed ones. */
export function valueChanges(
  stored: Partial<Record<FoodField, string>>,
  typed: Partial<Record<FoodField, string>>,
): { set: [FoodField, string][]; remove: FoodField[] } {
  const set: [FoodField, string][] = [];
  const remove: FoodField[] = [];
  for (const f of SNAPSHOT_FIELDS) {
    const a = stored[f];
    const b = typed[f];
    if (b === undefined) {
      if (a !== undefined) remove.push(f);
    } else if (a === undefined || Number(a) !== Number(b)) set.push([f, b]);
  }
  return { set, remove };
}

/** Writes the food's name and changed values; "gone" if not a live food, "taken" if the name is. */
export async function updateFood(
  db: Db,
  owner: Owner,
  id: string,
  name: string,
  typed: Partial<Record<FoodField, string>>,
): Promise<"ok" | "gone" | "taken"> {
  return db.transaction(async (tx) => {
    const [item] = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.id, id),
          eq(catalogItems.catalog, "food"),
          isNull(catalogItems.deletedAt),
        ),
      );
    if (!item) return "gone";
    const [twin] = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.catalog, "food"),
          isNull(catalogItems.parentId),
          isNull(catalogItems.deletedAt),
          ne(catalogItems.id, id),
          sql`lower(${catalogItems.name}) = lower(${name})`,
        ),
      )
      .limit(1);
    if (twin) return "taken";
    await tx
      .update(catalogItems)
      .set({ name })
      .where(and(ownedBy(catalogItems, owner), eq(catalogItems.id, id)));
    const rows = await tx
      .select({ field: catalogValues.field, num: catalogValues.num })
      .from(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          eq(catalogValues.itemId, id),
          inArray(catalogValues.field, [...SNAPSHOT_FIELDS]),
        ),
      );
    const stored: Partial<Record<FoodField, string>> = {};
    for (const r of rows) if (r.num !== null) stored[r.field as FoodField] = r.num;
    const { set, remove } = valueChanges(stored, typed);
    if (remove.length > 0)
      await tx
        .delete(catalogValues)
        .where(
          and(
            ownedBy(catalogValues, owner),
            eq(catalogValues.itemId, id),
            inArray(catalogValues.field, remove),
          ),
        );
    for (const [field, num] of set)
      await tx
        .insert(catalogValues)
        .values({
          userId: owner.id,
          itemId: id,
          field,
          num,
          source: "typed",
          confidence: "1",
        })
        .onConflictDoUpdate({
          target: [catalogValues.itemId, catalogValues.field],
          set: {
            num,
            text: null,
            bool: null,
            refItemId: null,
            source: "typed",
            confidence: "1",
          },
        });
    return "ok";
  });
}
