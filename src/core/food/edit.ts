/**
 * core/food/edit.ts — a food's editor (V-07): its name and its values per
 * 100. Only the values changed are written, as typed (source "typed",
 * confidence 1); the others keep their provenance. An emptied value is
 * removed. Logged meals keep their snapshot (ADR-0007): only what is
 * logged from now on reads the new values.
 */
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogValues } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { LABEL_FIELDS } from "../kinds/catalog";
import { SNAPSHOT_FIELDS } from "./choices";
import { recipeName, type RecipeNameError } from "./recipes";

export type FoodField = (typeof SNAPSHOT_FIELDS)[number];
export type FoodValueError = "number" | "too_much" | "nova";
/** The limits the registry declares for the label values (MOD-01: one declaration). */
const MAX = Object.fromEntries(LABEL_FIELDS.map((f) => [f.key, f.max])) as Record<
  FoodField,
  number
>;

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

/** A new food with its unit (g or ml) and typed values; "taken" if a live food has the name. */
export async function createFood(
  db: Db,
  owner: Owner,
  name: string,
  unit: "g" | "ml",
  values: Partial<Record<FoodField, string>>,
  /** Its barcode, when it came from one: a second scan finds it (`readFoodByBarcode`). */
  barcode: string | null = null,
  /** Values beyond the label's eight (micros, caffeine, package size), checked by the caller. */
  extra: Readonly<Record<string, string>> = {},
): Promise<{ id: string } | "taken"> {
  return db.transaction(async (tx) => {
    const [twin] = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.catalog, "food"),
          isNull(catalogItems.parentId),
          isNull(catalogItems.deletedAt),
          sql`lower(${catalogItems.name}) = lower(${name})`,
        ),
      )
      .limit(1);
    if (twin) return "taken";
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog: "food", name })
      .returning({ id: catalogItems.id });
    const id = row!.id;
    await tx.insert(catalogValues).values([
      { userId: owner.id, itemId: id, field: "unit", text: unit },
      ...(barcode
        ? [{ userId: owner.id, itemId: id, field: "barcode", text: barcode }]
        : []),
      ...Object.entries({ ...extra, ...values }).map(([field, num]) => ({
        userId: owner.id,
        itemId: id,
        field,
        num,
      })),
    ]);
    return { id };
  });
}

/**
 * A new product of a food (ADR-0055): its brand as its name, the values its
 * label gives (the others are the food's); "taken" if the food has a live
 * product with that name, "gone" if the food is not a live one of the owner.
 */
export async function createProduct(
  db: Db,
  owner: Owner,
  foodId: string,
  brand: string,
  values: Partial<Record<FoodField, string>>,
): Promise<{ id: string } | "taken" | "gone"> {
  return db.transaction(async (tx) => {
    const [food] = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.id, foodId),
          eq(catalogItems.catalog, "food"),
          isNull(catalogItems.deletedAt),
        ),
      );
    if (!food) return "gone";
    const [twin] = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.catalog, "product"),
          eq(catalogItems.parentId, foodId),
          isNull(catalogItems.deletedAt),
          sql`lower(${catalogItems.name}) = lower(${brand})`,
        ),
      )
      .limit(1);
    if (twin) return "taken";
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog: "product", name: brand, parentId: foodId })
      .returning({ id: catalogItems.id });
    const id = row!.id;
    const typed = Object.entries(values);
    if (typed.length > 0)
      await tx
        .insert(catalogValues)
        .values(
          typed.map(([field, num]) => ({ userId: owner.id, itemId: id, field, num })),
        );
    return { id };
  });
}

/**
 * The live food a barcode belongs to; null when none. A barcode is a format's
 * (GS1: one code per size, ADR-0060): format › product › food. Barcodes saved
 * on a food before that still find it.
 */
export async function readFoodByBarcode(
  db: Db,
  owner: Owner,
  barcode: string,
): Promise<string | null> {
  const [row] = await db
    .select({
      id: catalogItems.id,
      catalog: catalogItems.catalog,
      parentId: catalogItems.parentId,
    })
    .from(catalogValues)
    .innerJoin(catalogItems, eq(catalogItems.id, catalogValues.itemId))
    .where(
      and(
        ownedBy(catalogValues, owner),
        eq(catalogValues.field, "barcode"),
        eq(catalogValues.text, barcode),
        isNull(catalogItems.deletedAt),
      ),
    )
    .limit(1);
  let at: { id: string; catalog: string; parentId: string | null } | undefined = row;
  for (let up = 0; at && at.catalog !== "food" && at.parentId && up < 2; up++) {
    [at] = await db
      .select({
        id: catalogItems.id,
        catalog: catalogItems.catalog,
        parentId: catalogItems.parentId,
      })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.id, at.parentId),
          isNull(catalogItems.deletedAt),
        ),
      );
  }
  return at?.catalog === "food" ? at.id : null;
}

/**
 * A format of a product (ADR-0055, ADR-0060): its name («500 g»), its size in
 * the food's unit and its barcode; null when the product is not a live one.
 */
export async function createFormat(
  db: Db,
  owner: Owner,
  productId: string,
  f: { name: string; unit: "g" | "ml"; size: string | null; barcode: string | null },
): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [product] = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.id, productId),
          eq(catalogItems.catalog, "product"),
          isNull(catalogItems.deletedAt),
        ),
      );
    if (!product) return null;
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog: "format", name: f.name, parentId: productId })
      .returning({ id: catalogItems.id });
    const id = row!.id;
    await tx
      .insert(catalogValues)
      .values([
        { userId: owner.id, itemId: id, field: "unit", text: f.unit },
        ...(f.size ? [{ userId: owner.id, itemId: id, field: "size", num: f.size }] : []),
        ...(f.barcode
          ? [{ userId: owner.id, itemId: id, field: "barcode", text: f.barcode }]
          : []),
      ]);
    return id;
  });
}

/** The live product of a food with this brand (ignoring case), or null. */
export async function productByBrand(
  db: Db,
  owner: Owner,
  foodId: string,
  brand: string,
): Promise<string | null> {
  const [p] = await db
    .select({ id: catalogItems.id })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "product"),
        eq(catalogItems.parentId, foodId),
        isNull(catalogItems.deletedAt),
        sql`lower(${catalogItems.name}) = lower(${brand})`,
      ),
    )
    .limit(1);
  return p?.id ?? null;
}

/**
 * Marks a live food as an «assunzione» or not (FOOD-44, ADR-0060), with the dose
 * one tap logs and its name («capsula»): the three fields written again.
 */
export async function setIntake(
  db: Db,
  owner: Owner,
  foodId: string,
  i: { intake: boolean; dose: string | null; doseName: string | null },
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [food] = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.id, foodId),
          eq(catalogItems.catalog, "food"),
          isNull(catalogItems.deletedAt),
        ),
      );
    if (!food) return false;
    await tx
      .delete(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          eq(catalogValues.itemId, foodId),
          inArray(catalogValues.field, ["intake", "dose", "doseName"]),
        ),
      );
    await tx
      .insert(catalogValues)
      .values([
        { userId: owner.id, itemId: foodId, field: "intake", bool: i.intake },
        ...(i.dose
          ? [{ userId: owner.id, itemId: foodId, field: "dose", num: i.dose }]
          : []),
        ...(i.doseName
          ? [{ userId: owner.id, itemId: foodId, field: "doseName", text: i.doseName }]
          : []),
      ]);
    return true;
  });
}
