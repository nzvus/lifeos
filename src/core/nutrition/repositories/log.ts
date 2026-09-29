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

export type LoggedLine = TotalsLine & { name: string; unit: Ingredient["unit"] };

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
