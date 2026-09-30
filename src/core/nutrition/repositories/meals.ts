/**
 * core/nutrition/repositories/meals.ts — meals and their ingredient lines.
 *
 * A meal is a named list of (ingredient, quantity) for ONE serving. Its totals
 * are never stored: they are computed on every read from the CURRENT
 * ingredient values via core/nutrition/totals.ts (ADR-0003). That is right for
 * a recipe — fix a label error and every meal using it is corrected. It would
 * be wrong for history, which is why the log keeps snapshots (ADR-0007).
 *
 * Writes that touch several rows run in a TRANSACTION: either every statement
 * succeeds or none does, so a crash halfway can never leave a meal with half
 * its items (PROJECT.md: data never silently corrupted).
 *
 * Called by: src/app/(app)/meals/* and core/nutrition/repositories/log.ts.
 * Tested in: meals.test.ts.
 */
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import { ingredients, mealItems, mealRatings, meals } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import {
  fail,
  ok,
  pgErrorCode,
  type FieldErrors,
  type Result,
} from "../../shared/result";
import { sumLines, toDisplay, type DisplayTotals, type TotalsLine } from "../totals";
import type { Moment } from "../moments";
import { qualityOf, type Quality } from "../quality";
import type { MealInput } from "../validation";

/** A meal to save; the category (ADR-0011) may be left out (imports, tests). */
type MealWrite = Omit<MealInput, "category" | "review" | "ratings"> & {
  category?: Moment | null;
  /** ADR-0012: notes and 1–5 scores per factor; left out = keep as is. */
  review?: string;
  ratings?: { factorId: string; score: number }[];
};

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Replaces a meal's scores, inside the caller's transaction. */
async function setRatings(
  tx: Tx,
  owner: Owner,
  mealId: string,
  ratings: NonNullable<MealWrite["ratings"]>,
) {
  await tx
    .delete(mealRatings)
    .where(and(ownedBy(mealRatings, owner), eq(mealRatings.mealId, mealId)));
  if (ratings.length)
    await tx.insert(mealRatings).values(
      ratings.map((r) => ({
        userId: owner.id,
        mealId,
        factorId: r.factorId,
        score: r.score,
      })),
    );
}

/** Every rated factor must be one of mine (the composite key would refuse it anyway). */
async function checkFactors(
  db: Db,
  owner: Owner,
  input: MealWrite,
): Promise<FieldErrors | null> {
  if (!input.ratings?.length) return null;
  const mine = new Set((await listFactors(db, owner)).map((f) => f.id));
  return input.ratings.every((r) => mine.has(r.factorId))
    ? null
    : { ratings: "not_found" };
}
import { getIngredientsByIds, per100Of, type Ingredient } from "./ingredients";
import { listFactors } from "./ratings";

/** One line of a meal, joined with the ingredient it uses. */
export type MealLine = TotalsLine & {
  ingredientId: string;
  ingredientName: string;
  unit: Ingredient["unit"];
  /** ADR-0012: the ingredient's quality attributes, as they are now. */
  quality: Quality;
};

/** A meal as the UI needs it: the row, its lines, and its computed totals. */
export type MealWithLines = {
  id: string;
  name: string;
  notes: string;
  /** ADR-0011: optional, a hint for the moment of new entries. */
  category: Moment | null;
  /** ADR-0012: the user's notes next to the ratings. */
  review: string;
  lines: MealLine[];
  totals: DisplayTotals; // per ONE serving
};

/**
 * All my meals with lines and totals. Two queries (meals, then all their
 * lines) instead of one per meal: the "N+1 queries" problem avoided.
 */
export async function listMeals(db: Db, owner: Owner): Promise<MealWithLines[]> {
  const mealRows = await db
    .select()
    .from(meals)
    .where(ownedBy(meals, owner))
    .orderBy(asc(meals.name));

  // Every line of every meal of mine, with its ingredient's current values.
  const lineRows = await db
    .select({ item: mealItems, ingredient: ingredients })
    .from(mealItems)
    .innerJoin(ingredients, eq(mealItems.ingredientId, ingredients.id))
    .where(ownedBy(mealItems, owner))
    .orderBy(asc(mealItems.position));

  // Group lines by meal id: Map<mealId, MealLine[]>.
  const linesByMeal = new Map<string, MealLine[]>();
  for (const { item, ingredient } of lineRows) {
    const list = linesByMeal.get(item.mealId) ?? [];
    list.push(toMealLine(item.quantity, ingredient));
    linesByMeal.set(item.mealId, list);
  }

  return mealRows.map((m) => {
    const lines = linesByMeal.get(m.id) ?? [];
    return {
      id: m.id,
      name: m.name,
      notes: m.notes,
      category: m.category,
      review: m.review,
      lines,
      totals: toDisplay(sumLines(lines)),
    };
  });
}

/** One of my meals with lines and totals, or null. */
export async function getMeal(
  db: Db,
  owner: Owner,
  id: string,
): Promise<MealWithLines | null> {
  const [m] = await db
    .select()
    .from(meals)
    .where(and(ownedBy(meals, owner), eq(meals.id, id)));
  if (!m) return null;
  const lineRows = await db
    .select({ item: mealItems, ingredient: ingredients })
    .from(mealItems)
    .innerJoin(ingredients, eq(mealItems.ingredientId, ingredients.id))
    .where(and(ownedBy(mealItems, owner), eq(mealItems.mealId, id)))
    .orderBy(asc(mealItems.position));
  const lines = lineRows.map(({ item, ingredient }) =>
    toMealLine(item.quantity, ingredient),
  );
  return {
    id: m.id,
    name: m.name,
    notes: m.notes,
    category: m.category,
    review: m.review,
    lines,
    totals: toDisplay(sumLines(lines)),
  };
}

function toMealLine(quantity: string, ing: Ingredient): MealLine {
  return {
    ingredientId: ing.id,
    ingredientName: ing.name,
    unit: ing.unit,
    quantity,
    per100: per100Of(ing),
    packagePriceCents: ing.packagePriceCents,
    packageSize: ing.packageSize,
    quality: qualityOf(ing),
  };
}

/**
 * Checks that every ingredient in the input exists AND is mine, and reports
 * each bad line by its form field name ("items.2.ingredientId"). The composite
 * foreign key in the schema would also refuse a foreign ingredient; checking
 * first gives a precise error instead of a generic failure.
 */
async function checkIngredients(
  db: Db,
  owner: Owner,
  input: MealWrite,
): Promise<FieldErrors | null> {
  const ids = input.items.map((i) => i.ingredientId);
  const found = new Set((await getIngredientsByIds(db, owner, ids)).map((i) => i.id));
  const errors: FieldErrors = {};
  input.items.forEach((item, idx) => {
    if (!found.has(item.ingredientId)) errors[`items.${idx}.ingredientId`] = "not_found";
  });
  return Object.keys(errors).length ? errors : null;
}

export async function createMeal(
  db: Db,
  owner: Owner,
  input: MealWrite,
): Promise<Result<{ id: string }>> {
  const bad =
    (await checkIngredients(db, owner, input)) ?? (await checkFactors(db, owner, input));
  if (bad) return fail(bad);
  try {
    // db.transaction: everything inside uses `tx`; any throw rolls it all back.
    const id = await db.transaction(async (tx) => {
      const [meal] = await tx
        .insert(meals)
        .values({
          userId: owner.id,
          name: input.name,
          notes: input.notes,
          category: input.category ?? null,
          review: input.review ?? "",
        })
        .returning({ id: meals.id });
      await tx.insert(mealItems).values(
        input.items.map((item, position) => ({
          userId: owner.id,
          mealId: meal!.id,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          position,
        })),
      );
      if (input.ratings) await setRatings(tx, owner, meal!.id, input.ratings);
      return meal!.id;
    });
    return ok({ id });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/**
 * Replaces a meal's name, notes and ALL its lines. "Delete all lines, insert
 * the new list" is simpler and safer than diffing old vs new lines, and the
 * transaction makes it atomic.
 */
export async function updateMeal(
  db: Db,
  owner: Owner,
  id: string,
  input: MealWrite,
): Promise<Result<{ id: string }>> {
  const bad =
    (await checkIngredients(db, owner, input)) ?? (await checkFactors(db, owner, input));
  if (bad) return fail(bad);
  try {
    const found = await db.transaction(async (tx) => {
      const updated = await tx
        .update(meals)
        .set({
          name: input.name,
          notes: input.notes,
          category: input.category ?? null,
          ...(input.review !== undefined && { review: input.review }),
        })
        .where(and(ownedBy(meals, owner), eq(meals.id, id)))
        .returning({ id: meals.id });
      if (updated.length === 0) return false; // not mine / not there: change nothing
      await tx
        .delete(mealItems)
        .where(and(ownedBy(mealItems, owner), eq(mealItems.mealId, id)));
      await tx.insert(mealItems).values(
        input.items.map((item, position) => ({
          userId: owner.id,
          mealId: id,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          position,
        })),
      );
      if (input.ratings) await setRatings(tx, owner, id, input.ratings);
      return true;
    });
    return found ? ok({ id }) : fail({ _form: "not_found" });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/**
 * Deletes a meal and (cascade) its lines. Log entries that used it keep their
 * snapshot and label; their meal_id just becomes null (ADR-0007).
 */
export async function deleteMeal(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const deleted = await db
    .delete(meals)
    .where(and(ownedBy(meals, owner), eq(meals.id, id)))
    .returning({ id: meals.id });
  return deleted.length ? ok(null) : fail({ _form: "not_found" });
}
