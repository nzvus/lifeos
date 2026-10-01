/**
 * core/trash/trash.ts — the trash page and its purge (ADR-0015): every
 * record in the trash, whatever its kind; restore (the kinds' own restore,
 * with their rules: a meal brings its ingredients back, a name taken
 * meanwhile is refused); delete for good; and the daily purge of what has
 * been in the trash for more than TRASH_DAYS.
 *
 * Deleting for good respects the foreign keys that say "restrict": an
 * ingredient still in a meal, or an exercise still in a routine or in a
 * session's history, stays — even when that meal or routine is itself in
 * the trash. The purge deletes the containers first, so their contents can
 * go in the same run.
 *
 * Called by: src/app/(app)/settings/trash (the page and its actions) and
 * scripts/purge-trash.ts (the daily workflow, every user).
 * Tested in: trash.test.ts.
 */
import { and, eq, isNotNull, lt, notExists } from "drizzle-orm";
import type { Db } from "../db/client";
import {
  batches,
  bodyMeasurements,
  dayProfiles,
  exercises,
  ingredients,
  logEntries,
  mealItems,
  meals,
  products,
  purchases,
  reminders,
  routineItems,
  routines,
  sessionExercises,
  trainingSessions,
} from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { restoreBatch } from "../nutrition/repositories/batches";
import { restoreIngredients } from "../nutrition/repositories/ingredients";
import { restoreLogEntry } from "../nutrition/repositories/log";
import { restoreMeal } from "../nutrition/repositories/meals";
import { restoreProfile } from "../nutrition/repositories/profiles";
import { restoreProduct, restorePurchase } from "../pantry/repositories/products";
import { restoreReminder } from "../pantry/repositories/reminders";
import { restoreExercise } from "../training/repositories/exercises";
import { restoreMeasurement } from "../training/repositories/measurements";
import { restoreRoutine } from "../training/repositories/routines";
import { restoreSession } from "../training/repositories/sessions";
import { fail, ok, pgErrorCode, type Result } from "../shared/result";
import { TRASH_DAYS } from "../shared/trash";

export const TRASH_KINDS = [
  "meal",
  "ingredient",
  "logEntry",
  "dayProfile",
  "session",
  "routine",
  "exercise",
  "measurement",
  // ADR-0017: the pantry.
  "product",
  "purchase",
  "batch",
  "reminder",
] as const;
export type TrashKind = (typeof TRASH_KINDS)[number];

export function isTrashKind(v: string): v is TrashKind {
  return (TRASH_KINDS as readonly string[]).includes(v);
}

export type TrashItem = {
  kind: TrashKind;
  id: string;
  /** Its name; for a measurement, its weight (the page adds the unit). */
  name: string;
  /** The day it belongs to (entries, sessions, measurements), else null. */
  day: string | null;
  /** ISO instant. */
  deletedAt: string;
  /** ISO instant from which the purge deletes it. */
  purgeAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Everything of mine in the trash, most recently deleted first. */
export async function listTrash(db: Db, owner: Owner): Promise<TrashItem[]> {
  const named = (t: typeof meals | typeof ingredients | typeof dayProfiles) =>
    db
      .select({ id: t.id, name: t.name, deletedAt: t.deletedAt })
      .from(t)
      .where(and(ownedBy(t, owner), isNotNull(t.deletedAt)));
  const [m, i, p, r, x, e, s, b, pr, pu, ba, re] = await Promise.all([
    named(meals),
    named(ingredients),
    named(dayProfiles),
    db
      .select({ id: routines.id, name: routines.name, deletedAt: routines.deletedAt })
      .from(routines)
      .where(and(ownedBy(routines, owner), isNotNull(routines.deletedAt))),
    db
      .select({ id: exercises.id, name: exercises.name, deletedAt: exercises.deletedAt })
      .from(exercises)
      .where(and(ownedBy(exercises, owner), isNotNull(exercises.deletedAt))),
    db
      .select({
        id: logEntries.id,
        name: logEntries.label,
        day: logEntries.day,
        deletedAt: logEntries.deletedAt,
      })
      .from(logEntries)
      .where(and(ownedBy(logEntries, owner), isNotNull(logEntries.deletedAt))),
    db
      .select({
        id: trainingSessions.id,
        name: trainingSessions.label,
        day: trainingSessions.day,
        deletedAt: trainingSessions.deletedAt,
      })
      .from(trainingSessions)
      .where(
        and(ownedBy(trainingSessions, owner), isNotNull(trainingSessions.deletedAt)),
      ),
    db
      .select({
        id: bodyMeasurements.id,
        name: bodyMeasurements.weightKg,
        day: bodyMeasurements.day,
        deletedAt: bodyMeasurements.deletedAt,
      })
      .from(bodyMeasurements)
      .where(
        and(ownedBy(bodyMeasurements, owner), isNotNull(bodyMeasurements.deletedAt)),
      ),
    db
      .select({ id: products.id, name: products.name, deletedAt: products.deletedAt })
      .from(products)
      .where(and(ownedBy(products, owner), isNotNull(products.deletedAt))),
    db
      .select({
        id: purchases.id,
        name: products.name,
        day: purchases.day,
        deletedAt: purchases.deletedAt,
      })
      .from(purchases)
      .innerJoin(products, eq(purchases.productId, products.id))
      .where(and(ownedBy(purchases, owner), isNotNull(purchases.deletedAt))),
    db
      .select({
        id: batches.id,
        name: batches.label,
        day: batches.day,
        deletedAt: batches.deletedAt,
      })
      .from(batches)
      .where(and(ownedBy(batches, owner), isNotNull(batches.deletedAt))),
    db
      .select({ id: reminders.id, name: reminders.text, deletedAt: reminders.deletedAt })
      .from(reminders)
      .where(and(ownedBy(reminders, owner), isNotNull(reminders.deletedAt))),
  ]);
  const item =
    (kind: TrashKind) =>
    (row: { id: string; name: string | null; day?: string; deletedAt: Date | null }) => {
      const at = row.deletedAt!;
      return {
        kind,
        id: row.id,
        name: row.name ?? "",
        day: row.day ?? null,
        deletedAt: at.toISOString(),
        purgeAt: new Date(at.getTime() + TRASH_DAYS * DAY_MS).toISOString(),
      };
    };
  return [
    ...m.map(item("meal")),
    ...i.map(item("ingredient")),
    ...p.map(item("dayProfile")),
    ...r.map(item("routine")),
    ...x.map(item("exercise")),
    ...e.map(item("logEntry")),
    ...s.map(item("session")),
    ...b.map(item("measurement")),
    ...pr.map(item("product")),
    ...pu.map(item("purchase")),
    ...ba.map(item("batch")),
    ...re.map(item("reminder")),
  ].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

/** Takes one record out of the trash, with its kind's own rules. */
export function restoreFromTrash(
  db: Db,
  owner: Owner,
  kind: TrashKind,
  id: string,
): Promise<Result<null>> {
  switch (kind) {
    case "meal":
      return restoreMeal(db, owner, id);
    case "ingredient":
      return restoreIngredients(db, owner, [id]);
    case "logEntry":
      return restoreLogEntry(db, owner, id);
    case "dayProfile":
      return restoreProfile(db, owner, id);
    case "session":
      return restoreSession(db, owner, id);
    case "routine":
      return restoreRoutine(db, owner, id);
    case "exercise":
      return restoreExercise(db, owner, id);
    case "measurement":
      return restoreMeasurement(db, owner, id);
    case "product":
      return restoreProduct(db, owner, id);
    case "purchase":
      return restorePurchase(db, owner, id);
    case "batch":
      return restoreBatch(db, owner, id);
    case "reminder":
      return restoreReminder(db, owner, id);
  }
}

/** The tables that have a trash (a `deleted_at`). */
type TrashTable =
  | typeof meals
  | typeof ingredients
  | typeof logEntries
  | typeof dayProfiles
  | typeof trainingSessions
  | typeof routines
  | typeof exercises
  | typeof bodyMeasurements
  | typeof products
  | typeof purchases
  | typeof batches
  | typeof reminders;

/**
 * Deletes one of my records in the trash for good (only from the trash:
 * a live record is never deleted here). Lines, sets and items go with it
 * (cascade); "still_referenced" when something else still points to it.
 */
export async function purgeFromTrash(
  db: Db,
  owner: Owner,
  kind: TrashKind,
  id: string,
): Promise<Result<null>> {
  // One branch per table: drizzle needs the concrete table for the types.
  const where = <T extends TrashTable>(t: T) =>
    and(ownedBy(t, owner), isNotNull(t.deletedAt), eq(t.id, id));
  try {
    const gone = await (() => {
      switch (kind) {
        case "meal":
          return db.delete(meals).where(where(meals)).returning({ id: meals.id });
        case "ingredient":
          return db
            .delete(ingredients)
            .where(where(ingredients))
            .returning({ id: ingredients.id });
        case "logEntry":
          return db
            .delete(logEntries)
            .where(where(logEntries))
            .returning({ id: logEntries.id });
        case "dayProfile":
          return db
            .delete(dayProfiles)
            .where(where(dayProfiles))
            .returning({ id: dayProfiles.id });
        case "session":
          return db
            .delete(trainingSessions)
            .where(where(trainingSessions))
            .returning({ id: trainingSessions.id });
        case "routine":
          return db
            .delete(routines)
            .where(where(routines))
            .returning({ id: routines.id });
        case "exercise":
          return db
            .delete(exercises)
            .where(where(exercises))
            .returning({ id: exercises.id });
        case "measurement":
          return db
            .delete(bodyMeasurements)
            .where(where(bodyMeasurements))
            .returning({ id: bodyMeasurements.id });
        case "product":
          return db
            .delete(products)
            .where(where(products))
            .returning({ id: products.id });
        case "purchase":
          return db
            .delete(purchases)
            .where(where(purchases))
            .returning({ id: purchases.id });
        case "batch":
          return db.delete(batches).where(where(batches)).returning({ id: batches.id });
        case "reminder":
          return db
            .delete(reminders)
            .where(where(reminders))
            .returning({ id: reminders.id });
      }
    })();
    return gone.length ? ok(null) : fail({ _form: "not_found" });
  } catch (e) {
    // 23001 restrict / 23503 foreign key: something still points to it.
    const code = pgErrorCode(e);
    if (code === "23001" || code === "23503") return fail({ _form: "still_referenced" });
    throw e;
  }
}

/**
 * The daily purge, for EVERY user (a system job, not a user action):
 * deletes what entered the trash before `now - TRASH_DAYS`. Containers
 * first (sessions, routines, meals), so their exercises and ingredients
 * can follow in the same run; an ingredient or exercise something still
 * points to is skipped, not an error. Returns how many of each went.
 */
export async function purgeExpiredTrash(
  db: Db,
  now: Date = new Date(),
): Promise<Record<TrashKind, number>> {
  const cutoff = new Date(now.getTime() - TRASH_DAYS * DAY_MS);
  const expired = <T extends TrashTable>(t: T) =>
    and(isNotNull(t.deletedAt), lt(t.deletedAt, cutoff));
  const count = (rows: unknown[]) => rows.length;
  return db.transaction(async (tx) => {
    const session = count(
      await tx
        .delete(trainingSessions)
        .where(expired(trainingSessions))
        .returning({ id: trainingSessions.id }),
    );
    const routine = count(
      await tx.delete(routines).where(expired(routines)).returning({ id: routines.id }),
    );
    const meal = count(
      await tx.delete(meals).where(expired(meals)).returning({ id: meals.id }),
    );
    const logEntry = count(
      await tx
        .delete(logEntries)
        .where(expired(logEntries))
        .returning({ id: logEntries.id }),
    );
    const measurement = count(
      await tx
        .delete(bodyMeasurements)
        .where(expired(bodyMeasurements))
        .returning({ id: bodyMeasurements.id }),
    );
    // ADR-0017: purchases and batches, then products (before the
    // ingredients they may point to), then reminders.
    const purchase = count(
      await tx
        .delete(purchases)
        .where(expired(purchases))
        .returning({ id: purchases.id }),
    );
    const batch = count(
      await tx.delete(batches).where(expired(batches)).returning({ id: batches.id }),
    );
    const product = count(
      await tx.delete(products).where(expired(products)).returning({ id: products.id }),
    );
    const reminder = count(
      await tx
        .delete(reminders)
        .where(expired(reminders))
        .returning({ id: reminders.id }),
    );
    const dayProfile = count(
      await tx
        .delete(dayProfiles)
        .where(expired(dayProfiles))
        .returning({ id: dayProfiles.id }),
    );
    const ingredient = count(
      await tx
        .delete(ingredients)
        .where(
          and(
            expired(ingredients),
            notExists(
              tx
                .select({ id: mealItems.mealId })
                .from(mealItems)
                .where(eq(mealItems.ingredientId, ingredients.id)),
            ),
            // A product still pointing to it (live, or younger in the trash).
            notExists(
              tx
                .select({ id: products.id })
                .from(products)
                .where(eq(products.ingredientId, ingredients.id)),
            ),
          ),
        )
        .returning({ id: ingredients.id }),
    );
    const exercise = count(
      await tx
        .delete(exercises)
        .where(
          and(
            expired(exercises),
            notExists(
              tx
                .select({ id: routineItems.routineId })
                .from(routineItems)
                .where(eq(routineItems.exerciseId, exercises.id)),
            ),
            notExists(
              tx
                .select({ id: sessionExercises.sessionId })
                .from(sessionExercises)
                .where(eq(sessionExercises.exerciseId, exercises.id)),
            ),
          ),
        )
        .returning({ id: exercises.id }),
    );
    return {
      meal,
      ingredient,
      logEntry,
      dayProfile,
      session,
      routine,
      exercise,
      measurement,
      product,
      purchase,
      batch,
      reminder,
    };
  });
}
