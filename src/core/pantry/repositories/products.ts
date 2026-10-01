/**
 * core/pantry/repositories/products.ts — products, their purchases and the
 * stock counts (ADR-0013/0017). Every read and write takes an Owner and
 * filters with ownedBy(); a product's ingredient must be mine, live, and in
 * the same unit (g or ml), checked here and again by the composite FK.
 * Delete = trash (ADR-0015), like everything else.
 *
 * Tested in: products.test.ts.
 */
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import { ingredients, products, purchases, stockCounts } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { getIngredient } from "../../nutrition/repositories/ingredients";
import { fail, ok, pgErrorCode, type Result } from "../../shared/result";
import { live } from "../../shared/trash";
import type { CountInput, ProductInput, PurchaseInput } from "../validation";

export type Product = typeof products.$inferSelect & {
  /** The linked ingredient's name, when there is one. */
  ingredientName: string | null;
};
export type Purchase = typeof purchases.$inferSelect;

/** The ingredient may be linked only if it is mine, live, and in the product's unit. */
async function checkIngredient(
  db: Db,
  owner: Owner,
  input: ProductInput,
): Promise<Result<null>> {
  if (input.ingredientId === null) return ok(null);
  const ing = await getIngredient(db, owner, input.ingredientId);
  if (!ing) return fail({ ingredientId: "not_found" });
  if (ing.unit !== input.unit) return fail({ ingredientId: "invalid_choice" });
  return ok(null);
}

export async function listProducts(db: Db, owner: Owner): Promise<Product[]> {
  return db
    .select({ product: products, ingredientName: ingredients.name })
    .from(products)
    .leftJoin(ingredients, eq(products.ingredientId, ingredients.id))
    .where(and(ownedBy(products, owner), live(products)))
    .orderBy(asc(products.name))
    .then((rows) =>
      rows.map((r) => ({ ...r.product, ingredientName: r.ingredientName })),
    );
}

export async function getProduct(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Product | null> {
  const [row] = await db
    .select({ product: products, ingredientName: ingredients.name })
    .from(products)
    .leftJoin(ingredients, eq(products.ingredientId, ingredients.id))
    .where(and(ownedBy(products, owner), live(products), eq(products.id, id)));
  return row ? { ...row.product, ingredientName: row.ingredientName } : null;
}

export async function createProduct(
  db: Db,
  owner: Owner,
  input: ProductInput,
): Promise<Result<{ id: string }>> {
  const checked = await checkIngredient(db, owner, input);
  if (!checked.ok) return checked;
  try {
    const [row] = await db
      .insert(products)
      .values({ ...input, userId: owner.id })
      .returning({ id: products.id });
    return ok({ id: row!.id });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

export async function updateProduct(
  db: Db,
  owner: Owner,
  id: string,
  input: ProductInput,
): Promise<Result<null>> {
  const checked = await checkIngredient(db, owner, input);
  if (!checked.ok) return checked;
  try {
    const done = await db
      .update(products)
      .set(input)
      .where(and(ownedBy(products, owner), live(products), eq(products.id, id)))
      .returning({ id: products.id });
    return done.length ? ok(null) : fail({ _form: "not_found" });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/** To the trash (ADR-0015): out of the lists and of the stock. */
export async function deleteProduct(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(products)
    .set({ deletedAt: new Date() })
    .where(and(ownedBy(products, owner), live(products), eq(products.id, id)))
    .returning({ id: products.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}

export async function restoreProduct(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  try {
    const done = await db
      .update(products)
      .set({ deletedAt: null })
      .where(
        and(ownedBy(products, owner), isNotNull(products.deletedAt), eq(products.id, id)),
      )
      .returning({ id: products.id });
    return done.length ? ok(null) : fail({ _form: "not_found" });
  } catch (e) {
    // A live namesake was created meanwhile: refused, not merged.
    if (pgErrorCode(e) === "23505") return fail({ _form: "duplicate_name" });
    throw e;
  }
}

export async function addPurchase(
  db: Db,
  owner: Owner,
  input: PurchaseInput,
): Promise<Result<{ id: string }>> {
  if (!(await getProduct(db, owner, input.productId)))
    return fail({ productId: "not_found" });
  const [row] = await db
    .insert(purchases)
    .values({ ...input, userId: owner.id })
    .returning({ id: purchases.id });
  return ok({ id: row!.id });
}

/** A product's purchases, newest first (price history). */
export async function listPurchases(
  db: Db,
  owner: Owner,
  productId: string,
): Promise<Purchase[]> {
  return db
    .select()
    .from(purchases)
    .where(
      and(ownedBy(purchases, owner), live(purchases), eq(purchases.productId, productId)),
    )
    .orderBy(desc(purchases.day), desc(purchases.createdAt));
}

export async function deletePurchase(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(purchases)
    .set({ deletedAt: new Date() })
    .where(and(ownedBy(purchases, owner), live(purchases), eq(purchases.id, id)))
    .returning({ id: purchases.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}

export async function restorePurchase(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(purchases)
    .set({ deletedAt: null })
    .where(
      and(
        ownedBy(purchases, owner),
        isNotNull(purchases.deletedAt),
        eq(purchases.id, id),
      ),
    )
    .returning({ id: purchases.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}

/** "I have this much now" (at `at`, default now). */
export async function addCount(
  db: Db,
  owner: Owner,
  input: CountInput,
  at: Date = new Date(),
): Promise<Result<null>> {
  if (input.productId && !(await getProduct(db, owner, input.productId)))
    return fail({ _form: "not_found" });
  if (input.ingredientId && !(await getIngredient(db, owner, input.ingredientId)))
    return fail({ _form: "not_found" });
  await db.insert(stockCounts).values({ ...input, userId: owner.id, at });
  return ok(null);
}
