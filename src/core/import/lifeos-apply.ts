/**
 * core/import/lifeos-apply.ts — REPLACES one account's nutrition data with
 * the contents of a validated lifeos export (./lifeos.ts).
 *
 * Destructive by design, so:
 *   - ONE transaction: deleting the old data and inserting the new either
 *     both happen or neither does. A crash halfway leaves the account as it
 *     was, never half-empty.
 *   - The command (scripts/import-lifeos.ts) takes a backup first in the
 *     runbook, runs a dry run by default, and needs an explicit flag.
 *   - Only the owner's rows are touched (every delete is `ownedBy`); the
 *     account itself (user, password, sessions) is kept.
 *
 * Log entries are restored AS LOGGED: their snapshots (ADR-0007), servings
 * and creation times come from the file, so history is identical.
 * Tested in lifeos.test.ts (round trip: export -> replace -> export).
 */
import { count } from "drizzle-orm";
import type { Db } from "../db/client";
import {
  dayPlans,
  dayProfiles,
  ingredients,
  ingredientTags,
  logEntries,
  logEntryItems,
  mealItems,
  mealRatings,
  ratingFactors,
  meals,
  tags,
  userSettings,
} from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { isLocale } from "../shared/locales";
import { isTheme } from "../shared/themes";
import type { LifeosImport } from "./lifeos";

export type ReplaceCounts = {
  ingredients: number;
  meals: number;
  dayProfiles: number;
  dayPlans: number;
  logEntries: number;
};

/** What the account holds now (the dry run's "before" column). */
export async function countOwned(db: Db, owner: Owner): Promise<ReplaceCounts> {
  const [i] = await db
    .select({ n: count() })
    .from(ingredients)
    .where(ownedBy(ingredients, owner));
  const [m] = await db.select({ n: count() }).from(meals).where(ownedBy(meals, owner));
  const [p] = await db
    .select({ n: count() })
    .from(dayProfiles)
    .where(ownedBy(dayProfiles, owner));
  const [d] = await db
    .select({ n: count() })
    .from(dayPlans)
    .where(ownedBy(dayPlans, owner));
  const [e] = await db
    .select({ n: count() })
    .from(logEntries)
    .where(ownedBy(logEntries, owner));
  return {
    ingredients: i!.n,
    meals: m!.n,
    dayProfiles: p!.n,
    dayPlans: d!.n,
    logEntries: e!.n,
  };
}

export async function replaceWithExport(
  db: Db,
  owner: Owner,
  data: LifeosImport,
): Promise<ReplaceCounts> {
  const u = owner.id;
  await db.transaction(async (tx) => {
    // 1. Delete, children before parents (foreign keys). Cascades would also
    //    remove items, but explicit order makes the intent readable.
    await tx.delete(logEntryItems).where(ownedBy(logEntryItems, owner));
    await tx.delete(logEntries).where(ownedBy(logEntries, owner));
    await tx.delete(dayPlans).where(ownedBy(dayPlans, owner));
    await tx.delete(dayProfiles).where(ownedBy(dayProfiles, owner));
    await tx.delete(mealRatings).where(ownedBy(mealRatings, owner));
    await tx.delete(ratingFactors).where(ownedBy(ratingFactors, owner));
    await tx.delete(mealItems).where(ownedBy(mealItems, owner));
    await tx.delete(meals).where(ownedBy(meals, owner));
    await tx.delete(ingredientTags).where(ownedBy(ingredientTags, owner));
    await tx.delete(ingredients).where(ownedBy(ingredients, owner));
    await tx.delete(tags).where(ownedBy(tags, owner));
    await tx.delete(userSettings).where(ownedBy(userSettings, owner));

    // 2. Insert, parents before children, mapping file ids -> new ids.
    if (data.settings) {
      // Every setting, not only time zone and language: a replace must not
      // silently reset the theme or the preferences.
      await tx.insert(userSettings).values({
        ...data.settings,
        userId: u,
        locale: isLocale(data.settings.locale) ? data.settings.locale : "it",
        theme: isTheme(data.settings.theme) ? data.settings.theme : "label",
      });
    }
    const ingredientId = new Map<string, string>();
    for (const { id, tags: tagList, ...i } of data.ingredients) {
      const [row] = await tx
        .insert(ingredients)
        .values({ ...i, userId: u })
        .returning({ id: ingredients.id });
      ingredientId.set(id, row!.id);
      for (const t of tagList) {
        const [tag] = await tx
          .insert(tags)
          .values({ userId: u, name: t.name, icon: t.icon })
          .onConflictDoUpdate({ target: [tags.userId, tags.name], set: { icon: t.icon } })
          .returning({ id: tags.id });
        await tx
          .insert(ingredientTags)
          .values({ userId: u, ingredientId: row!.id, tagId: tag!.id })
          .onConflictDoNothing();
      }
    }
    const factorId = new Map<string, string>();
    for (const { id, ...f } of data.ratingFactors) {
      const [row] = await tx
        .insert(ratingFactors)
        .values({ ...f, userId: u })
        .returning({ id: ratingFactors.id });
      factorId.set(id, row!.id);
    }
    const mealId = new Map<string, string>();
    for (const { id, items, ratings, ...m } of data.meals) {
      const [row] = await tx
        .insert(meals)
        .values({ ...m, userId: u })
        .returning({ id: meals.id });
      mealId.set(id, row!.id);
      const scores = ratings.filter((r) => factorId.has(r.factorId)); // checked by the parser too
      if (scores.length) {
        await tx.insert(mealRatings).values(
          scores.map((r) => ({
            userId: u,
            mealId: row!.id,
            factorId: factorId.get(r.factorId)!,
            score: r.score,
          })),
        );
      }
      if (items.length) {
        await tx.insert(mealItems).values(
          items.map((it) => ({
            userId: u,
            mealId: row!.id,
            ingredientId: ingredientId.get(it.ingredientId)!, // checked by the parser
            quantity: it.quantity,
            position: it.position,
          })),
        );
      }
    }
    const profileId = new Map<string, string>();
    for (const { id, ...p } of data.dayProfiles) {
      const [row] = await tx
        .insert(dayProfiles)
        .values({ ...p, userId: u })
        .returning({ id: dayProfiles.id });
      profileId.set(id, row!.id);
    }
    for (const p of data.dayPlans) {
      await tx.insert(dayPlans).values({
        ...p,
        userId: u,
        profileId: p.profileId ? (profileId.get(p.profileId) ?? null) : null,
      });
    }
    for (const { items, createdAt, at, ...e } of data.log) {
      const [row] = await tx
        .insert(logEntries)
        .values({
          ...e,
          userId: u,
          mealId: e.mealId ? (mealId.get(e.mealId) ?? null) : null,
          createdAt: new Date(createdAt), // keeps the day's order as logged
          at: at === null ? null : new Date(at),
        })
        .returning({ id: logEntries.id });
      if (items.length) {
        await tx.insert(logEntryItems).values(
          items.map((it) => ({
            ...it,
            userId: u,
            entryId: row!.id,
            ingredientId: it.ingredientId
              ? (ingredientId.get(it.ingredientId) ?? null)
              : null,
          })),
        );
      }
    }
  });
  return {
    ingredients: data.ingredients.length,
    meals: data.meals.length,
    dayProfiles: data.dayProfiles.length,
    dayPlans: data.dayPlans.length,
    logEntries: data.log.length,
  };
}
