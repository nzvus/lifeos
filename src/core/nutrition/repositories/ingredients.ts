/**
 * core/nutrition/repositories/ingredients.ts — every read and write of the
 * `ingredients` table.
 *
 * The repository pattern, as ADR-0003 applies it: the rest of the app never
 * writes SQL. It calls these functions, which
 *   1. take `db` (so tests can pass an in-memory database) and an `owner`
 *      (so no call can forget whose data it is — core/identity/owner.ts),
 *   2. put `ownedBy(ingredients, owner)` in EVERY query's WHERE clause,
 *   3. return plain typed rows, or a Result with error codes.
 *
 * Called by: src/app/(app)/ingredients/actions.ts and pages, and by the meals
 * and log repositories (to check an ingredient exists and belongs to the owner).
 * Tested in: ingredients.test.ts (including the cross-user test).
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../../db/client";
import { ingredients, ingredientTags, tags } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { fail, ok, pgErrorCode, type Result } from "../../shared/result";
import type { IngredientInput } from "../validation";
import { NUTRIENT_KEYS, type NutrientValues } from "../nutrients";

/**
 * A row as Drizzle returns it. `$inferSelect` derives the type from the
 * schema, so it can never drift from the table definition.
 */
export type Ingredient = typeof ingredients.$inferSelect;

/** Extracts the per-100 nutrient values from a row (for totals/snapshots). */
export function per100Of(row: NutrientValues): NutrientValues {
  const out = {} as NutrientValues;
  for (const k of NUTRIENT_KEYS) out[k] = row[k];
  return out;
}

/** All my ingredients, alphabetically. */
export async function listIngredients(db: Db, owner: Owner): Promise<Ingredient[]> {
  return db
    .select()
    .from(ingredients)
    .where(ownedBy(ingredients, owner))
    .orderBy(asc(ingredients.name));
}

/**
 * One of MY ingredients, or null. Note the `and(ownedBy, id)`: asking for
 * someone else's id returns null exactly like a non-existent id, so the
 * response doesn't even reveal that the row exists.
 */
export async function getIngredient(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Ingredient | null> {
  const rows = await db
    .select()
    .from(ingredients)
    .where(and(ownedBy(ingredients, owner), eq(ingredients.id, id)));
  return rows[0] ?? null;
}

/** Several of my ingredients by id (used by meals/log). Missing ids are just absent. */
export async function getIngredientsByIds(
  db: Db,
  owner: Owner,
  ids: readonly string[],
): Promise<Ingredient[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(ingredients)
    .where(and(ownedBy(ingredients, owner), inArray(ingredients.id, [...ids])));
}

/**
 * What create/update accept: the form's fields; the quality attributes and
 * tags (ADR-0012) may be left out (importers, tests) — on update, left-out
 * means "keep as is".
 */
export type IngredientWrite = Omit<
  IngredientInput,
  "nova" | "origin" | "fiberTypes" | "tags"
> &
  Partial<Pick<IngredientInput, "nova" | "origin" | "fiberTypes" | "tags">>;

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Replaces an ingredient's free tags: each name becomes one of my tags
 * (created if new, its icon updated if it changed), then the links are
 * rewritten. Inside the caller's transaction.
 */
async function setTags(
  tx: Tx,
  owner: Owner,
  ingredientId: string,
  list: NonNullable<IngredientInput["tags"]>,
): Promise<void> {
  await tx
    .delete(ingredientTags)
    .where(
      and(ownedBy(ingredientTags, owner), eq(ingredientTags.ingredientId, ingredientId)),
    );
  for (const t of list) {
    const [tag] = await tx
      .insert(tags)
      .values({ userId: owner.id, name: t.name, icon: t.icon })
      .onConflictDoUpdate({ target: [tags.userId, tags.name], set: { icon: t.icon } })
      .returning({ id: tags.id });
    await tx
      .insert(ingredientTags)
      .values({ userId: owner.id, ingredientId, tagId: tag!.id })
      .onConflictDoNothing(); // the same name twice in the list
  }
}

export async function createIngredient(
  db: Db,
  owner: Owner,
  input: IngredientWrite,
): Promise<Result<Ingredient>> {
  const { tags: tagList, ...fields } = input;
  try {
    const row = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(ingredients)
        .values({ ...fields, userId: owner.id }) // owner always from the Owner, never from input
        .returning();
      if (tagList) await setTags(tx, owner, created!.id, tagList);
      return created!; // insert ... returning always yields the inserted row
    });
    return ok(row);
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e; // anything else is unexpected: let it surface
  }
}

export async function updateIngredient(
  db: Db,
  owner: Owner,
  id: string,
  input: IngredientWrite,
): Promise<Result<Ingredient>> {
  const { tags: tagList, ...fields } = input;
  try {
    const row = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(ingredients)
        .set(fields)
        .where(and(ownedBy(ingredients, owner), eq(ingredients.id, id)))
        .returning();
      if (updated && tagList) await setTags(tx, owner, id, tagList);
      return updated;
    });
    // No row updated = not mine or not existing. Same answer for both.
    return row ? ok(row) : fail({ _form: "not_found" });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/** A free tag (ADR-0012). */
export type Tag = { id: string; name: string; icon: string };

/** All my free tags, alphabetically. */
export async function listTags(db: Db, owner: Owner): Promise<Tag[]> {
  return db
    .select({ id: tags.id, name: tags.name, icon: tags.icon })
    .from(tags)
    .where(ownedBy(tags, owner))
    .orderBy(asc(tags.name));
}

/** The free tags of each of my ingredients: ingredient id -> tags. */
export async function tagsByIngredient(
  db: Db,
  owner: Owner,
): Promise<Map<string, Tag[]>> {
  const rows = await db
    .select({
      ingredientId: ingredientTags.ingredientId,
      id: tags.id,
      name: tags.name,
      icon: tags.icon,
    })
    .from(ingredientTags)
    .innerJoin(tags, eq(ingredientTags.tagId, tags.id))
    .where(ownedBy(ingredientTags, owner))
    .orderBy(asc(tags.name));
  const out = new Map<string, Tag[]>();
  for (const { ingredientId, ...tag } of rows)
    out.set(ingredientId, [...(out.get(ingredientId) ?? []), tag]);
  return out;
}

/**
 * Deletes one of my ingredients. If a meal still uses it, the foreign key
 * (meal_items_ingredient_fk, ON DELETE RESTRICT) makes Postgres refuse, and we
 * report "in_use". Logged history is unaffected either way: log entries hold
 * their own snapshot (ADR-0007).
 */
export async function deleteIngredient(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  try {
    const deleted = await db
      .delete(ingredients)
      .where(and(ownedBy(ingredients, owner), eq(ingredients.id, id)))
      .returning({ id: ingredients.id });
    return deleted.length ? ok(null) : fail({ _form: "not_found" });
  } catch (e) {
    const code = pgErrorCode(e);
    // RESTRICT reports 23001; a plain foreign key would report 23503.
    if (code === "23001" || code === "23503") return fail({ _form: "in_use" });
    throw e;
  }
}
