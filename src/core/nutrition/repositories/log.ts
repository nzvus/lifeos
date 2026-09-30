/**
 * core/nutrition/repositories/log.ts — the daily food log.
 *
 * The core idea (ADR-0007): logging COPIES. When you log a meal, each of its
 * ingredient lines is copied, with the ingredient's nutrient values and price
 * as they are right now, into log_entry_items. Later edits to the ingredient or
 * meal never change what was logged. Day totals are computed on read from
 * those copies (ADR-0003: no stored aggregates), so "totals = parts" holds.
 *
 * Called by: src/app/(app)/page.tsx (the day view) and its actions.ts.
 * Tested in: log.test.ts (snapshot behaviour, totals, cross-user isolation).
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../../db/client";
import { logEntries, logEntryItems } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { fail, ok, type Result } from "../../shared/result";
import {
  addTotals,
  sumLines,
  toDisplay,
  type DisplayTotals,
  type TotalsLine,
} from "../totals";
import type { LogIngredientInput, LogMealInput } from "../validation";
import { getIngredient, per100Of, type Ingredient } from "./ingredients";
import { getMeal } from "./meals";
import { ensureDayPlan } from "./profiles";

export type LoggedLine = TotalsLine & {
  name: string;
  unit: Ingredient["unit"];
  /** Link to the current ingredient; null if it was deleted since. */
  ingredientId: string | null;
};

export type LogEntryView = {
  id: string;
  label: string;
  /** Multiplier applied to every line ("1" for a single ingredient). */
  servings: string;
  /** The meal it was logged from; null for a single ingredient or a deleted meal. */
  mealId: string | null;
  lines: LoggedLine[];
  totals: DisplayTotals; // already multiplied by servings
};

export type DayView = {
  day: string;
  entries: LogEntryView[];
  totals: DisplayTotals; // sum of the EXACT entry totals, rounded once
};

/** Everything I logged on one day, with per-entry and whole-day totals. */
export async function getDay(db: Db, owner: Owner, day: string): Promise<DayView> {
  const entries = await db
    .select()
    .from(logEntries)
    .where(and(ownedBy(logEntries, owner), eq(logEntries.day, day)))
    .orderBy(asc(logEntries.createdAt));

  const entryIds = entries.map((e) => e.id);
  const items =
    entryIds.length === 0
      ? []
      : await db
          .select()
          .from(logEntryItems)
          .where(
            and(ownedBy(logEntryItems, owner), inArray(logEntryItems.entryId, entryIds)),
          )
          .orderBy(asc(logEntryItems.position));

  const linesByEntry = new Map<string, LoggedLine[]>();
  for (const it of items) {
    const list = linesByEntry.get(it.entryId) ?? [];
    list.push({
      name: it.name,
      unit: it.unit,
      ingredientId: it.ingredientId,
      quantity: it.quantity,
      per100: per100Of(it),
      packagePriceCents: it.packagePriceCents,
      packageSize: it.packageSize,
    });
    linesByEntry.set(it.entryId, list);
  }

  // Keep EXACT totals per entry, add them exactly, and round only at the end.
  const exact = entries.map((e) => sumLines(linesByEntry.get(e.id) ?? [], e.servings));
  return {
    day,
    entries: entries.map((e, i) => ({
      id: e.id,
      label: e.label,
      servings: e.servings,
      mealId: e.mealId,
      lines: linesByEntry.get(e.id) ?? [],
      totals: toDisplay(exact[i]!),
    })),
    totals: toDisplay(addTotals(exact)),
  };
}

/** Logs N servings of one of my meals, snapshotting its current composition. */
export async function logMeal(
  db: Db,
  owner: Owner,
  input: LogMealInput,
): Promise<Result<{ id: string }>> {
  const meal = await getMeal(db, owner, input.mealId); // owner-checked read
  if (!meal) return fail({ mealId: "not_found" });

  const id = await db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(logEntries)
      .values({
        userId: owner.id,
        day: input.day,
        mealId: meal.id,
        label: meal.name, // the name as it is today
        servings: input.servings,
      })
      .returning({ id: logEntries.id });
    await tx.insert(logEntryItems).values(
      meal.lines.map((line, position) => ({
        userId: owner.id,
        entryId: entry!.id,
        ingredientId: line.ingredientId,
        name: line.ingredientName,
        unit: line.unit,
        quantity: line.quantity,
        ...line.per100, // the COPY: kcal, protein, ... as they are right now
        packagePriceCents: line.packagePriceCents,
        packageSize: line.packageSize,
        position,
      })),
    );
    return entry!.id;
  });
  // First food of the day fixes the day's targets (ADR-0008). Outside the
  // transaction on purpose: if this step failed, the food is still logged
  // and the next log call fixes the day.
  await ensureDayPlan(db, owner, input.day);
  return ok({ id });
}

/** Logs a quantity of a single ingredient (a snack, a fruit) as its own entry. */
export async function logIngredient(
  db: Db,
  owner: Owner,
  input: LogIngredientInput,
): Promise<Result<{ id: string }>> {
  const ing = await getIngredient(db, owner, input.ingredientId);
  if (!ing) return fail({ ingredientId: "not_found" });

  const id = await db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(logEntries)
      .values({ userId: owner.id, day: input.day, label: ing.name, servings: "1" })
      .returning({ id: logEntries.id });
    await tx.insert(logEntryItems).values({
      userId: owner.id,
      entryId: entry!.id,
      ingredientId: ing.id,
      name: ing.name,
      unit: ing.unit,
      quantity: input.quantity,
      ...per100Of(ing),
      packagePriceCents: ing.packagePriceCents,
      packageSize: ing.packageSize,
      position: 0,
    });
    return entry!.id;
  });
  await ensureDayPlan(db, owner, input.day); // see logMeal
  return ok({ id });
}

/** Removes one of my log entries (its snapshot lines go with it: cascade). */
export async function deleteLogEntry(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const deleted = await db
    .delete(logEntries)
    .where(and(ownedBy(logEntries, owner), eq(logEntries.id, id)))
    .returning({ id: logEntries.id });
  return deleted.length ? ok(null) : fail({ _form: "not_found" });
}

/**
 * Copies every entry of one day into another ("repeat yesterday's meals").
 *
 * What is copied is the SNAPSHOT (ADR-0007): the lines exactly as they were
 * logged, not the current version of the meals. "I ate the same again"
 * means the same food; if a recipe changed since, log it fresh instead.
 * One transaction: either the whole day is copied or nothing is. The target
 * day then gets its targets fixed like any day with food (ADR-0008).
 * Returns how many entries were copied (0 if the source day was empty).
 */
export async function copyDay(
  db: Db,
  owner: Owner,
  fromDay: string,
  toDay: string,
): Promise<Result<{ copied: number }>> {
  const source = await getDay(db, owner, fromDay); // owner-filtered read
  if (source.entries.length === 0) return ok({ copied: 0 });

  await db.transaction(async (tx) => {
    for (const e of source.entries) {
      const [entry] = await tx
        .insert(logEntries)
        .values({
          userId: owner.id,
          day: toDay,
          mealId: e.mealId,
          label: e.label,
          servings: e.servings,
        })
        .returning({ id: logEntries.id });
      await tx.insert(logEntryItems).values(
        e.lines.map((l, position) => ({
          userId: owner.id,
          entryId: entry!.id,
          ingredientId: l.ingredientId,
          name: l.name,
          unit: l.unit,
          quantity: l.quantity,
          ...l.per100,
          packagePriceCents: l.packagePriceCents,
          packageSize: l.packageSize,
          position,
        })),
      );
    }
  });
  await ensureDayPlan(db, owner, toDay);
  return ok({ copied: source.entries.length });
}

/**
 * Rebuilds a logged entry from the CURRENT meal or ingredient: the deliberate
 * way to apply later corrections (a price added, a label fixed) to a past
 * entry — ADR-0007's tripwire "re-snapshot this entry". Day, servings and
 * (for a single ingredient) quantity are kept; name and values are refreshed.
 * Fails with not_found if the meal/ingredient it came from no longer exists.
 */
export async function refreshLogEntry(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const [entry] = await db
    .select()
    .from(logEntries)
    .where(and(ownedBy(logEntries, owner), eq(logEntries.id, id)));
  if (!entry) return fail({ _form: "not_found" });
  const oldItems = await db
    .select()
    .from(logEntryItems)
    .where(and(ownedBy(logEntryItems, owner), eq(logEntryItems.entryId, id)));

  let label: string;
  let lines: Omit<typeof logEntryItems.$inferInsert, "userId" | "entryId" | "position">[];
  if (entry.mealId) {
    const meal = await getMeal(db, owner, entry.mealId);
    if (!meal) return fail({ _form: "not_found" });
    label = meal.name;
    lines = meal.lines.map((l) => ({
      ingredientId: l.ingredientId,
      name: l.ingredientName,
      unit: l.unit,
      quantity: l.quantity,
      ...l.per100,
      packagePriceCents: l.packagePriceCents,
      packageSize: l.packageSize,
    }));
  } else {
    const only = oldItems.length === 1 ? oldItems[0]! : null;
    const ing = only?.ingredientId
      ? await getIngredient(db, owner, only.ingredientId)
      : null;
    if (!only || !ing) return fail({ _form: "not_found" });
    label = ing.name;
    lines = [
      {
        ingredientId: ing.id,
        name: ing.name,
        unit: ing.unit,
        quantity: only.quantity, // what you ate stays; only the values refresh
        ...per100Of(ing),
        packagePriceCents: ing.packagePriceCents,
        packageSize: ing.packageSize,
      },
    ];
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(logEntryItems)
      .where(and(ownedBy(logEntryItems, owner), eq(logEntryItems.entryId, id)));
    await tx
      .insert(logEntryItems)
      .values(
        lines.map((l, position) => ({ ...l, userId: owner.id, entryId: id, position })),
      );
    await tx
      .update(logEntries)
      .set({ label })
      .where(and(ownedBy(logEntries, owner), eq(logEntries.id, id)));
  });
  return ok(null);
}
