/**
 * core/export/export.ts — "give me all my data" (PROJECT.md v1 §5, ADR-0003).
 *
 * ADR-0003 calls the user-facing export "the human-readable half of
 * durability": the pg_dump backup protects against losing the database; this
 * export protects against losing the ACCOUNT or the whole service, because
 * it is a plain JSON file you keep yourself, readable without this app.
 *
 * Design:
 *   - Versioned format (`format`, `version`): if the shape ever changes, a
 *     future importer can still recognise and convert old files.
 *   - Contains only the owner's rows (every query uses ownedBy — tested).
 *   - Excludes secrets: no password hash, no session tokens.
 *   - Rows are exported as stored (exact decimal strings, integer cents), not
 *     as rounded display values — an export is data, not a report.
 *
 * Called by: src/app/api/export/route.ts. Tested in export.test.ts.
 */
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import {
  bodyMeasurements,
  dayActivity,
  dayPlans,
  exercises,
  dayProfiles,
  ingredients,
  ingredientTags,
  logEntries,
  logEntryItems,
  mealItems,
  mealRatings,
  ratingFactors,
  routineItems,
  routines,
  sessionExercises,
  sets,
  tags,
  meals,
  trainingSessions,
  user,
  userSettings,
} from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { live } from "../shared/trash";

export const EXPORT_FORMAT = "lifeos-export";
/** 2: adds dayProfiles and dayPlans (ADR-0008). 3: log status/at/estimated (ADR-0009). */
// 4: category, moment (ADR-0011); 5: quality + tags (ADR-0012);
// 6: training — exercises, routines, sessions with exercises and sets, body
// measurements, day activity (ADR-0005/0016).
export const EXPORT_VERSION = 6;

/** Removes `userId` from every row: it's the same everywhere and meaningless outside. */
function stripOwner<T extends { userId: string }>(rows: T[]): Omit<T, "userId">[] {
  return rows.map(({ userId: _ignored, ...rest }) => rest);
}

export async function exportUserData(db: Db, owner: Owner, now: Date = new Date()) {
  // `user` has no user_id column (it IS the user), so filter by its id.
  const [me] = await db
    .select({ name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, owner.id));

  const [
    settings,
    ingredientRows,
    mealRows,
    mealItemRows,
    entryRows,
    entryItemRows,
    profileRows,
    planRows,
    tagRows,
    factorRows,
    ratingRows,
  ] = await Promise.all([
    db.select().from(userSettings).where(ownedBy(userSettings, owner)),
    db
      .select()
      .from(ingredients)
      .where(and(ownedBy(ingredients, owner), live(ingredients)))
      .orderBy(asc(ingredients.name)),
    // The trash is temporary (ADR-0015): only live meals and ingredients are exported.
    db
      .select()
      .from(meals)
      .where(and(ownedBy(meals, owner), live(meals)))
      .orderBy(asc(meals.name)),
    db.select().from(mealItems).where(ownedBy(mealItems, owner)),
    db
      .select()
      .from(logEntries)
      .where(and(ownedBy(logEntries, owner), live(logEntries)))
      .orderBy(asc(logEntries.day)),
    db.select().from(logEntryItems).where(ownedBy(logEntryItems, owner)),
    db
      .select()
      .from(dayProfiles)
      .where(and(ownedBy(dayProfiles, owner), live(dayProfiles)))
      .orderBy(asc(dayProfiles.name)),
    db.select().from(dayPlans).where(ownedBy(dayPlans, owner)).orderBy(asc(dayPlans.day)),
    db
      .select({
        ingredientId: ingredientTags.ingredientId,
        name: tags.name,
        icon: tags.icon,
      })
      .from(ingredientTags)
      .innerJoin(tags, eq(ingredientTags.tagId, tags.id))
      .where(ownedBy(ingredientTags, owner))
      .orderBy(asc(tags.name)),
    db
      .select()
      .from(ratingFactors)
      .where(ownedBy(ratingFactors, owner))
      .orderBy(asc(ratingFactors.position)),
    db.select().from(mealRatings).where(ownedBy(mealRatings, owner)),
  ]);

  // Training (ADR-0005), live records only like the rest; parts nest in
  // their parent (routine → items, session → exercises → sets).
  const [
    exerciseRows,
    routineRows,
    routineItemRows,
    sessionRows,
    sessionExRows,
    setRows,
    measurementRows,
    activityRows,
  ] = await Promise.all([
    db
      .select()
      .from(exercises)
      .where(and(ownedBy(exercises, owner), live(exercises)))
      .orderBy(asc(exercises.name)),
    db
      .select()
      .from(routines)
      .where(and(ownedBy(routines, owner), live(routines)))
      .orderBy(asc(routines.position)),
    db
      .select()
      .from(routineItems)
      .where(ownedBy(routineItems, owner))
      .orderBy(asc(routineItems.position)),
    db
      .select()
      .from(trainingSessions)
      .where(and(ownedBy(trainingSessions, owner), live(trainingSessions)))
      .orderBy(asc(trainingSessions.day)),
    db
      .select()
      .from(sessionExercises)
      .where(ownedBy(sessionExercises, owner))
      .orderBy(asc(sessionExercises.position)),
    db.select().from(sets).where(ownedBy(sets, owner)).orderBy(asc(sets.position)),
    db
      .select()
      .from(bodyMeasurements)
      .where(and(ownedBy(bodyMeasurements, owner), live(bodyMeasurements)))
      .orderBy(asc(bodyMeasurements.day)),
    db
      .select()
      .from(dayActivity)
      .where(ownedBy(dayActivity, owner))
      .orderBy(asc(dayActivity.day)),
  ]);

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    account: me ?? null,
    settings: stripOwner(settings)[0] ?? null,
    // Free tags ride along with each ingredient (ADR-0012).
    ingredients: stripOwner(ingredientRows).map((i) => ({
      ...i,
      tags: tagRows
        .filter((t) => t.ingredientId === i.id)
        .map(({ name, icon }) => ({ name, icon })),
    })),
    meals: stripOwner(mealRows).map((m) => ({
      ...m,
      items: stripOwner(mealItemRows.filter((i) => i.mealId === m.id)),
      ratings: ratingRows
        .filter((r) => r.mealId === m.id)
        .map(({ factorId, score }) => ({ factorId, score })),
    })),
    ratingFactors: stripOwner(factorRows),
    dayProfiles: stripOwner(profileRows),
    dayPlans: stripOwner(planRows),
    log: stripOwner(entryRows).map((e) => ({
      ...e,
      items: stripOwner(entryItemRows.filter((i) => i.entryId === e.id)),
    })),
    training: {
      exercises: stripOwner(exerciseRows),
      routines: stripOwner(routineRows).map((r) => ({
        ...r,
        items: stripOwner(routineItemRows.filter((i) => i.routineId === r.id)),
      })),
      sessions: stripOwner(sessionRows).map((x) => ({
        ...x,
        exercises: stripOwner(sessionExRows.filter((e) => e.sessionId === x.id)).map(
          (e) => ({
            ...e,
            sets: stripOwner(setRows.filter((st) => st.sessionExerciseId === e.id)),
          }),
        ),
      })),
      measurements: stripOwner(measurementRows),
      dayActivity: stripOwner(activityRows),
    },
  };
}

export type UserExport = Awaited<ReturnType<typeof exportUserData>>;
