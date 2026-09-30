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
import { asc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import {
  dayPlans,
  dayProfiles,
  ingredients,
  logEntries,
  logEntryItems,
  mealItems,
  meals,
  user,
  userSettings,
} from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";

export const EXPORT_FORMAT = "lifeos-export";
/** 2: adds dayProfiles and dayPlans (ADR-0008). 3: log status/at/estimated (ADR-0009). */
export const EXPORT_VERSION = 4; // 4: meal category, entry moment (ADR-0011)

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
  ] = await Promise.all([
    db.select().from(userSettings).where(ownedBy(userSettings, owner)),
    db
      .select()
      .from(ingredients)
      .where(ownedBy(ingredients, owner))
      .orderBy(asc(ingredients.name)),
    db.select().from(meals).where(ownedBy(meals, owner)).orderBy(asc(meals.name)),
    db.select().from(mealItems).where(ownedBy(mealItems, owner)),
    db
      .select()
      .from(logEntries)
      .where(ownedBy(logEntries, owner))
      .orderBy(asc(logEntries.day)),
    db.select().from(logEntryItems).where(ownedBy(logEntryItems, owner)),
    db
      .select()
      .from(dayProfiles)
      .where(ownedBy(dayProfiles, owner))
      .orderBy(asc(dayProfiles.name)),
    db.select().from(dayPlans).where(ownedBy(dayPlans, owner)).orderBy(asc(dayPlans.day)),
  ]);

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    account: me ?? null,
    settings: stripOwner(settings)[0] ?? null,
    ingredients: stripOwner(ingredientRows),
    meals: stripOwner(mealRows).map((m) => ({
      ...m,
      items: stripOwner(mealItemRows.filter((i) => i.mealId === m.id)),
    })),
    dayProfiles: stripOwner(profileRows),
    dayPlans: stripOwner(planRows),
    log: stripOwner(entryRows).map((e) => ({
      ...e,
      items: stripOwner(entryItemRows.filter((i) => i.entryId === e.id)),
    })),
  };
}

export type UserExport = Awaited<ReturnType<typeof exportUserData>>;
