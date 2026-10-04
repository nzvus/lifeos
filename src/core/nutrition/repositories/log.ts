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
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  batches,
  batchLines,
  logEntries,
  logEntryItems,
  logEntryLeftOut,
} from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { live } from "../../shared/trash";
import { fail, ok, type Result } from "../../shared/result";
import {
  addTotals,
  sumLines,
  toDisplay,
  type DisplayTotals,
  type TotalsLine,
} from "../totals";
import type { Moment } from "../moments";
import { qualityOf, type Quality } from "../quality";
import type {
  EntryLinesInput,
  EstimateInput,
  LogIngredientInput,
  LogMealInput,
} from "../validation";
import type { EntryStatus } from "../../db/schema";
import { instantFor } from "../../shared/dates";
import { Big } from "../../shared/decimal";
import { getIngredient, per100Of, type Ingredient } from "./ingredients";
import { getMeal } from "./meals";
import { ensureDayPlan } from "./profiles";

export type LoggedLine = TotalsLine & {
  /** The snapshot row's id (ADR-0022: edited in place). */
  itemId: string;
  name: string;
  unit: Ingredient["unit"];
  /** Link to the current ingredient; null if it was deleted since. */
  ingredientId: string | null;
  /** ADR-0012: quality attributes as they were when logged (snapshot). */
  quality: Quality;
};

export type LogEntryView = {
  id: string;
  day: string;
  label: string;
  /** Multiplier applied to every line ("1" for a single ingredient). */
  servings: string;
  /** The meal it was logged from; null for a single ingredient or a deleted meal. */
  mealId: string | null;
  /** ADR-0009: planned (intended) or eaten (confirmed). */
  status: EntryStatus;
  /** When eaten / planned, ISO instant; null if unknown. */
  at: string | null;
  /** ADR-0011: the stored moment, null if not set (derive with entryMoment). */
  moment: Moment | null;
  /** An estimated meal (typed approximate totals). */
  estimated: boolean;
  /** ADR-0017: a portion of a batch. */
  batchId: string | null;
  /** Planned but left out of the plan's total (log_entry_left_out). */
  leftOut: boolean;
  lines: LoggedLine[];
  totals: DisplayTotals; // already multiplied by servings
};

export type DayView = {
  day: string;
  entries: LogEntryView[];
  /** What was EATEN: the day's real totals (exact sum, rounded once). */
  totals: DisplayTotals;
  /** Only the planned entries that count (not left out). */
  planned: DisplayTotals;
  /** Eaten + the planned that count: where the day ends if the plan is followed. */
  withPlanned: DisplayTotals;
};

/** Everything I logged on one day, with per-entry and whole-day totals. */
export async function getDay(db: Db, owner: Owner, day: string): Promise<DayView> {
  const entries = await db
    .select()
    .from(logEntries)
    .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.day, day)))
    .orderBy(asc(logEntries.createdAt));

  const entryIds = entries.map((e) => e.id);
  const leftOut = new Set(
    entryIds.length === 0
      ? []
      : (
          await db
            .select({ id: logEntryLeftOut.entryId })
            .from(logEntryLeftOut)
            .where(
              and(
                ownedBy(logEntryLeftOut, owner),
                inArray(logEntryLeftOut.entryId, entryIds),
              ),
            )
        ).map((r) => r.id),
  );
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
      itemId: it.id,
      name: it.name,
      unit: it.unit,
      ingredientId: it.ingredientId,
      quantity: it.quantity,
      per100: per100Of(it),
      packagePriceCents: it.packagePriceCents,
      packageSize: it.packageSize,
      quality: qualityOf(it),
    });
    linesByEntry.set(it.entryId, list);
  }

  // Order by time of eating when known, else by when it was logged.
  const when = (e: (typeof entries)[number]) => (e.at ?? e.createdAt).getTime();
  entries.sort((a, b) => when(a) - when(b));

  // Keep EXACT totals per entry, add them exactly, and round only at the end.
  const exact = entries.map((e) => sumLines(linesByEntry.get(e.id) ?? [], e.servings));
  // A planned entry left out counts nowhere; eaten food always counts.
  const counts = (i: number) =>
    entries[i]!.status === "eaten" || !leftOut.has(entries[i]!.id);
  const sumWhere = (keep: (status: EntryStatus) => boolean) =>
    toDisplay(addTotals(exact.filter((_, i) => keep(entries[i]!.status) && counts(i))));
  return {
    day,
    entries: entries.map((e, i) => ({
      id: e.id,
      day: e.day,
      label: e.label,
      servings: e.servings,
      mealId: e.mealId,
      status: e.status,
      at: e.at ? e.at.toISOString() : null,
      moment: e.moment,
      estimated: e.estimated,
      batchId: e.batchId,
      leftOut: e.status === "planned" && leftOut.has(e.id),
      lines: linesByEntry.get(e.id) ?? [],
      totals: toDisplay(exact[i]!),
    })),
    totals: sumWhere((s) => s === "eaten"),
    planned: sumWhere((s) => s === "planned"),
    withPlanned: sumWhere(() => true),
  };
}

/** Logs N servings of one of my meals, snapshotting its current composition. */
export async function logMeal(
  db: Db,
  owner: Owner,
  input: Omit<LogMealInput, "planned" | "time" | "moment"> &
    Partial<EntryTiming> & { moment?: Moment | null },
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
        moment: input.moment ?? null,
        ...timingOf(input),
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
        ...line.quality, // and NOVA, origin, fibre types (ADR-0012)
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
  input: Omit<LogIngredientInput, "planned" | "time" | "moment"> &
    Partial<EntryTiming> & { moment?: Moment | null },
): Promise<Result<{ id: string }>> {
  const ing = await getIngredient(db, owner, input.ingredientId);
  if (!ing) return fail({ ingredientId: "not_found" });

  const id = await db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(logEntries)
      .values({
        userId: owner.id,
        day: input.day,
        label: ing.name,
        moment: input.moment ?? null,
        servings: "1",
        ...timingOf(input),
      })
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
      ...qualityOf(ing),
      position: 0,
    });
    return entry!.id;
  });
  await ensureDayPlan(db, owner, input.day); // see logMeal
  return ok({ id });
}

/**
 * A portion taken from a batch cooked earlier (ADR-0017): the entry points
 * to the batch, and its lines are the batch's lines ÷ portions (one
 * portion; quantities rounded to the column's 2 decimals), × servings. The
 * pantry skips it: the ingredients left when the batch was cooked.
 */
export async function logPortion(
  db: Db,
  owner: Owner,
  input: { batchId: string; day: string; servings: string } & Partial<EntryTiming> & {
      moment?: Moment | null;
    },
): Promise<Result<{ id: string }>> {
  const [batch] = await db
    .select()
    .from(batches)
    .where(and(ownedBy(batches, owner), live(batches), eq(batches.id, input.batchId)));
  if (!batch) return fail({ batchId: "not_found" });
  const lines = await db
    .select()
    .from(batchLines)
    .where(and(ownedBy(batchLines, owner), eq(batchLines.batchId, batch.id)))
    .orderBy(asc(batchLines.position));
  const id = await db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(logEntries)
      .values({
        userId: owner.id,
        day: input.day,
        mealId: batch.mealId,
        batchId: batch.id,
        label: batch.label,
        servings: input.servings,
        moment: input.moment ?? null,
        ...timingOf(input),
      })
      .returning({ id: logEntries.id });
    await tx.insert(logEntryItems).values(
      lines.map(({ id: _id, batchId: _b, userId: _u, quantity, ...line }) => ({
        ...line,
        userId: owner.id,
        entryId: entry!.id,
        quantity: new Big(quantity)
          .div(batch.portions)
          .round(2, Big.roundHalfUp)
          .toFixed(2),
      })),
    );
    return entry!.id;
  });
  await ensureDayPlan(db, owner, input.day);
  return ok({ id });
}

/** Moves one of my log entries to the trash (ADR-0015): out of the day and its totals. */
export async function deleteLogEntry(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const trashed = await db
    .update(logEntries)
    .set({ deletedAt: new Date() })
    .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)))
    .returning({ id: logEntries.id });
  return trashed.length ? ok(null) : fail({ _form: "not_found" });
}

/** Takes a log entry out of the trash (the toast's "Undo"). */
export async function restoreLogEntry(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const restored = await db
    .update(logEntries)
    .set({ deletedAt: null })
    .where(
      and(
        ownedBy(logEntries, owner),
        isNotNull(logEntries.deletedAt),
        eq(logEntries.id, id),
      ),
    )
    .returning({ id: logEntries.id });
  return restored.length ? ok(null) : fail({ _form: "not_found" });
}

/**
 * A planned entry in or out of the plan's total (2026-10-04): out = a row
 * in log_entry_left_out, in = none. Only my live entries; idempotent.
 */
export async function setEntryLeftOut(
  db: Db,
  owner: Owner,
  id: string,
  out: boolean,
): Promise<Result<null>> {
  const [entry] = await db
    .select({ id: logEntries.id })
    .from(logEntries)
    .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)));
  if (!entry) return fail({ _form: "not_found" });
  if (out)
    await db
      .insert(logEntryLeftOut)
      .values({ entryId: id, userId: owner.id })
      .onConflictDoNothing();
  else
    await db
      .delete(logEntryLeftOut)
      .where(and(ownedBy(logEntryLeftOut, owner), eq(logEntryLeftOut.entryId, id)));
  return ok(null);
}

/**
 * "Remove what's still planned": every live planned entry of a day goes to
 * the trash (ADR-0015), e.g. the dishes of a menu that were not chosen.
 * Eaten entries are never touched. Returns the ids, for one Undo.
 */
export async function trashPlanned(db: Db, owner: Owner, day: string): Promise<string[]> {
  const trashed = await db
    .update(logEntries)
    .set({ deletedAt: new Date() })
    .where(
      and(
        ownedBy(logEntries, owner),
        live(logEntries),
        eq(logEntries.day, day),
        eq(logEntries.status, "planned"),
      ),
    )
    .returning({ id: logEntries.id });
  return trashed.map((r) => r.id);
}

/** Takes several log entries out of the trash (trashPlanned's Undo). */
export async function restoreLogEntries(
  db: Db,
  owner: Owner,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const restored = await db
    .update(logEntries)
    .set({ deletedAt: null })
    .where(
      and(
        ownedBy(logEntries, owner),
        isNotNull(logEntries.deletedAt),
        inArray(logEntries.id, ids),
      ),
    )
    .returning({ id: logEntries.id });
  return restored.length;
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
          // Repeating a day creates a PLAN (ADR-0009): confirm what you
          // actually eat. Times are not copied.
          status: "planned",
          at: null,
          moment: e.moment, // the same moment as the day it repeats
          estimated: e.estimated,
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
          ...l.quality,
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
    .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)));
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
      ...l.quality,
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
        ...qualityOf(ing),
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
      .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)));
  });
  return ok(null);
}

/** When and whether an entry was eaten (ADR-0009). */
export type EntryTiming = { status: EntryStatus; at: Date | null };

/**
 * Defaults for entries created without explicit timing: eaten, now.
 * A planned entry without a time has no time.
 */
function timingOf(input: Partial<EntryTiming>): EntryTiming {
  const status = input.status ?? "eaten";
  const at = input.at !== undefined ? input.at : status === "eaten" ? new Date() : null;
  return { status, at };
}

/**
 * From a form's "Planned" checkbox and optional "HH:MM" to status + instant,
 * in the user's time zone. Eaten without a time = now; planned without a
 * time = no time. Pure; used by the server actions.
 */
export function entryTiming(
  day: string,
  planned: boolean,
  time: string | null,
  timeZone: string,
  now: Date = new Date(),
): EntryTiming {
  const status: EntryStatus = planned ? "planned" : "eaten";
  if (time) return { status, at: instantFor(day, time, timeZone) };
  return { status, at: planned ? null : now };
}

/**
 * Ticks or unticks an entry. Confirming sets the time to NOW (the moment
 * the box was ticked), which the user can then edit; un-confirming keeps
 * the time as a planned time.
 */
export async function setEntryStatus(
  db: Db,
  owner: Owner,
  id: string,
  status: EntryStatus,
  now: Date = new Date(),
  /** The user's today: an entry of a later day can only be planned. */
  today?: string,
): Promise<Result<null>> {
  if (status === "eaten" && today) {
    const [entry] = await db
      .select({ day: logEntries.day })
      .from(logEntries)
      .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)));
    if (!entry) return fail({ _form: "not_found" });
    if (entry.day > today) return fail({ _form: "future_day" });
  }
  const set = status === "eaten" ? { status, at: now } : { status };
  const updated = await db
    .update(logEntries)
    .set(set)
    .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)))
    .returning({ id: logEntries.id });
  return updated.length ? ok(null) : fail({ _form: "not_found" });
}

/** Sets an entry's multiplier (its lines stay as logged; totals scale). */
export async function setEntryServings(
  db: Db,
  owner: Owner,
  id: string,
  servings: number,
): Promise<Result<null>> {
  const updated = await db
    .update(logEntries)
    .set({ servings: servings.toFixed(2) })
    .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)))
    .returning({ id: logEntries.id });
  return updated.length ? ok(null) : fail({ _form: "not_found" });
}

/** Sets (or clears) the time of an entry. */
export async function setEntryTime(
  db: Db,
  owner: Owner,
  id: string,
  at: Date | null,
): Promise<Result<null>> {
  const updated = await db
    .update(logEntries)
    .set({ at })
    .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)))
    .returning({ id: logEntries.id });
  return updated.length ? ok(null) : fail({ _form: "not_found" });
}

/**
 * An "estimated meal" (ADR-0009): approximate totals typed by hand. Stored
 * like any entry, so totals stay "computed from lines" (ADR-0003): one line
 * of 100 g whose per-100 values ARE the typed totals; what is left empty is
 * stored as 0. The entry is flagged `estimated` so the UI shows it as "~". A typed cost becomes a 100 g "package" at that
 * price, so the cost adds up exactly.
 */
export async function logEstimate(
  db: Db,
  owner: Owner,
  input: Omit<EstimateInput, "planned" | "time" | "moment"> &
    Partial<EntryTiming> & { moment?: Moment | null },
): Promise<Result<{ id: string }>> {
  const id = await db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(logEntries)
      .values({
        userId: owner.id,
        day: input.day,
        label: input.label,
        servings: "1",
        estimated: true,
        moment: input.moment ?? null,
        ...timingOf(input),
      })
      .returning({ id: logEntries.id });
    await tx.insert(logEntryItems).values({
      userId: owner.id,
      entryId: entry!.id,
      name: input.label,
      unit: "g",
      quantity: "100",
      kcal: input.kcal,
      protein: input.protein,
      carbs: input.carbs,
      sugars: input.sugars,
      fat: input.fat,
      saturatedFat: input.saturatedFat,
      fiber: input.fiber,
      salt: input.salt,
      packagePriceCents:
        input.cost === null ? null : new Big(input.cost).times(100).toNumber(),
      packageSize: input.cost === null ? null : "100",
      position: 0,
    });
    return entry!.id;
  });
  await ensureDayPlan(db, owner, input.day);
  return ok({ id });
}

/** One live entry of mine with its lines (the entry editor, ADR-0022). */
export async function getLogEntry(
  db: Db,
  owner: Owner,
  id: string,
): Promise<LogEntryView | null> {
  const [entry] = await db
    .select({ day: logEntries.day })
    .from(logEntries)
    .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)));
  if (!entry) return null;
  const view = await getDay(db, owner, entry.day);
  return view.entries.find((e) => e.id === id) ?? null;
}

/**
 * ADR-0022: a day's entry edited as a LOCAL COPY — servings, each line's
 * quantity, lines added, removed or swapped. A kept line (its `itemId`)
 * keeps its snapshot values; a new or swapped ingredient is copied as it is
 * now. The meal it came from is never touched. Estimates and batch
 * portions have no ingredient lines to edit.
 */
export async function editLogEntry(
  db: Db,
  owner: Owner,
  id: string,
  input: EntryLinesInput,
): Promise<Result<null>> {
  const [entry] = await db
    .select()
    .from(logEntries)
    .where(and(ownedBy(logEntries, owner), live(logEntries), eq(logEntries.id, id)));
  if (!entry) return fail({ _form: "not_found" });
  if (entry.estimated || entry.batchId) return fail({ _form: "not_editable" });
  const old = await db
    .select()
    .from(logEntryItems)
    .where(and(ownedBy(logEntryItems, owner), eq(logEntryItems.entryId, id)));
  const byId = new Map(old.map((it) => [it.id, it]));

  const lines: Omit<
    typeof logEntryItems.$inferInsert,
    "userId" | "entryId" | "position"
  >[] = [];
  for (const [i, line] of input.items.entries()) {
    const kept = line.itemId ? byId.get(line.itemId) : undefined;
    if (kept && (!line.ingredientId || line.ingredientId === kept.ingredientId)) {
      // Same id: an Undo that sends the old lines back finds them again.
      const { userId: _u, entryId: _e, position: _p, ...snapshot } = kept;
      lines.push({ ...snapshot, quantity: line.quantity });
      continue;
    }
    const ing = line.ingredientId
      ? await getIngredient(db, owner, line.ingredientId)
      : null;
    if (!ing) return fail({ [`items.${i}.ingredientId`]: "not_found" });
    lines.push({
      ingredientId: ing.id,
      name: ing.name,
      unit: ing.unit,
      quantity: line.quantity,
      ...per100Of(ing),
      packagePriceCents: ing.packagePriceCents,
      packageSize: ing.packageSize,
      ...qualityOf(ing),
    });
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
      .set({ servings: input.servings })
      .where(and(ownedBy(logEntries, owner), eq(logEntries.id, id)));
  });
  return ok(null);
}
