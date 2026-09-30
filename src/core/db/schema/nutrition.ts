/**
 * core/db/schema/nutrition.ts — the nutrition tables (PROJECT.md §3, v1).
 *
 * Read this file top to bottom once: it IS the data model. Diagram:
 *
 *   user ─┬─< ingredients >──────────────┐ (restrict: can't delete an
 *         ├─< meals ─< meal_items >──────┘  ingredient a meal still uses)
 *         ├─< log_entries ─< log_entry_items   (a SNAPSHOT, see below)
 *         ├─< day_profiles ─┐ (set null: plans keep their copy)
 *         ├─< day_plans  <──┘  (one per day: chosen profile + targets COPY)
 *         └── user_settings (1 row: timezone, locale, theme)
 *
 * Rules applied to every table here (ADR-0003 / ADR-0006):
 *   - every user-owned table has `user_id` from its first migration, and is
 *     only ever queried through core/nutrition/repositories/*, which always
 *     filter by it (core/identity/owner.ts);
 *   - nutrients are `numeric` (exact decimal), money is integer cents;
 *   - primary keys are Postgres-generated UUIDs; timestamps have time zone;
 *   - no totals are stored anywhere (core/nutrition/totals.ts computes them).
 *
 * Day profiles (ADR-0008): targets depend on the kind of day (gym, run,
 * rest...). The user defines the kinds (day_profiles); each day that matters
 * gets a day_plans row holding a COPY of its profile's targets, for the same
 * reason log entries copy food (ADR-0007): editing a profile never rewrites
 * a past day.
 *
 * The one decision specific to this file (ADR-0007): a log entry does NOT
 * point at the live meal/ingredient for its numbers. When you log something,
 * its composition and nutrient values are COPIED into log_entry_items. So
 * editing an ingredient's label values next month can never silently rewrite
 * what you ate last week (PROJECT.md primary invariant: logged data is never
 * silently corrupted). Totals are still computed on read — from the snapshot.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Moment } from "../../nutrition/moments";
import type { NutrientKey } from "../../nutrition/nutrients";
import { user } from "./auth";

const tstz = (name: string) => timestamp(name, { withTimezone: true });
const idColumn = () =>
  uuid("id")
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey();

/** `user_id` column: required, and rows disappear if the user is deleted. */
const ownerColumn = () =>
  uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

/**
 * A nutrient amount per 100 g/ml. numeric(10,3): up to 9,999,999.999 with
 * exactly 3 decimals — plenty for "0.025 g salt" and for "884 kcal".
 * `mode: "string"` makes Drizzle hand us "12.300", never a float.
 */
const nutrient = (name: string) =>
  numeric(name, { precision: 10, scale: 3, mode: "string" });

/**
 * One column per nutrient. Listed explicitly (not generated in a loop) so the
 * table type stays precise; `satisfies` makes TypeScript fail here if a key is
 * added to NUTRIENT_KEYS but forgotten in this list.
 */
function nutrientColumns() {
  return {
    kcal: nutrient("kcal").notNull(),
    protein: nutrient("protein").notNull(),
    carbs: nutrient("carbs").notNull(),
    sugars: nutrient("sugars").notNull(),
    fat: nutrient("fat").notNull(),
    saturatedFat: nutrient("saturated_fat").notNull(),
    fiber: nutrient("fiber").notNull(),
    salt: nutrient("salt").notNull(),
  } satisfies Record<NutrientKey, unknown>;
}

/** Same columns, nullable, named target_*: "no target set" is a real state. */
function targetColumns() {
  return {
    kcal: nutrient("target_kcal"),
    protein: nutrient("target_protein"),
    carbs: nutrient("target_carbs"),
    sugars: nutrient("target_sugars"),
    fat: nutrient("target_fat"),
    saturatedFat: nutrient("target_saturated_fat"),
    fiber: nutrient("target_fiber"),
    salt: nutrient("target_salt"),
  } satisfies Record<NutrientKey, unknown>;
}

/** Whether a log entry is only planned or actually eaten (ADR-0009). */
export const ENTRY_STATUSES = ["planned", "eaten"] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

/** Units an ingredient can be measured in. Nutrients are per 100 of it. */
export const INGREDIENT_UNITS = ["g", "ml"] as const;
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

/**
 * An ingredient as on its label: nutrients per 100 g/ml, optional price.
 * Price is stored as the thing you actually pay: a package price in cents and
 * the package size (e.g. 189 cents for 500 g). Price per gram is derived.
 */
export const ingredients = pgTable(
  "ingredients",
  {
    id: idColumn(),
    userId: ownerColumn(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    unit: text("unit").$type<IngredientUnit>().notNull().default("g"),
    ...nutrientColumns(), // spreads kcal, protein, ... into this table
    packagePriceCents: integer("package_price_cents"),
    packageSize: numeric("package_size", { precision: 10, scale: 2, mode: "string" }),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    // Two ingredients of the same user can't share a name (per user, not global).
    unique("ingredients_user_name_uq").on(t.userId, t.name),
    // Needed so child tables can reference (id, user_id) together — see meal_items.
    unique("ingredients_id_user_uq").on(t.id, t.userId),
    check("ingredients_unit_ck", sql`${t.unit} in ('g', 'ml')`),
    // Both price fields set, or both empty: half a price is meaningless.
    check(
      "ingredients_price_pair_ck",
      sql`(${t.packagePriceCents} is null) = (${t.packageSize} is null)`,
    ),
  ],
);

/** A named recipe or fixed meal ("Colazione fissa", "Gnocchi al pesto"). */
export const meals = pgTable(
  "meals",
  {
    id: idColumn(),
    userId: ownerColumn(),
    name: text("name").notNull(),
    notes: text("notes").notNull().default(""),
    // ADR-0011: optional category, only a hint for the moment of new entries.
    category: text("category").$type<Moment>(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    check(
      "meals_category_ck",
      sql`${t.category} in ('breakfast', 'lunch', 'snack', 'dinner')`,
    ),
    unique("meals_user_name_uq").on(t.userId, t.name),
    unique("meals_id_user_uq").on(t.id, t.userId),
  ],
);

/**
 * One ingredient × quantity inside a meal (for ONE serving).
 *
 * The composite foreign keys below are defence in depth for isolation: the
 * pair (meal_id, user_id) must exist in meals, and (ingredient_id, user_id) in
 * ingredients. So even a bug in the repositories cannot attach my ingredient
 * to your meal — the database itself refuses the row.
 */
export const mealItems = pgTable(
  "meal_items",
  {
    id: idColumn(),
    userId: uuid("user_id").notNull(),
    mealId: uuid("meal_id").notNull(),
    ingredientId: uuid("ingredient_id").notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2, mode: "string" }).notNull(),
    position: integer("position").notNull(), // display order inside the meal
  },
  (t) => [
    foreignKey({
      name: "meal_items_meal_fk",
      columns: [t.mealId, t.userId],
      foreignColumns: [meals.id, meals.userId],
    }).onDelete("cascade"), // deleting a meal deletes its items
    foreignKey({
      name: "meal_items_ingredient_fk",
      columns: [t.ingredientId, t.userId],
      foreignColumns: [ingredients.id, ingredients.userId],
    }).onDelete("restrict"), // an ingredient in use can't be deleted
    check("meal_items_quantity_ck", sql`${t.quantity} > 0`),
    index("meal_items_meal_idx").on(t.mealId),
  ],
);

/**
 * Something eaten on a given day: either a meal (× servings) or a single
 * ingredient. `label` is the name AT LOGGING TIME, so the entry still reads
 * correctly if the meal is later renamed or deleted (meal_id becomes null).
 */
export const logEntries = pgTable(
  "log_entries",
  {
    id: idColumn(),
    userId: ownerColumn(),
    // mode "string": 'YYYY-MM-DD', no time, no time zone — a calendar day.
    day: date("day", { mode: "string" }).notNull(),
    mealId: uuid("meal_id").references(() => meals.id, { onDelete: "set null" }),
    label: text("label").notNull(),
    servings: numeric("servings", { precision: 6, scale: 2, mode: "string" })
      .notNull()
      .default("1"),
    // ADR-0009. "planned": intended, not eaten yet (drawn translucent, not
    // counted as eaten). "eaten": confirmed. Existing rows became "eaten".
    status: text("status").$type<EntryStatus>().notNull().default("eaten"),
    // When it was (or is planned to be) eaten. Set to "now" when an entry is
    // confirmed, editable. Null = unknown (entries logged before 0003).
    at: tstz("at"),
    // true for an "estimated meal": typed approximate totals, not ingredients.
    estimated: boolean("estimated").notNull().default(false),
    // ADR-0011: the moment of the day, stored as it happened. Null = not set
    // (older entries): derived from `at` when read.
    moment: text("moment").$type<Moment>(),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("log_entries_id_user_uq").on(t.id, t.userId),
    check("log_entries_status_ck", sql`${t.status} in ('planned', 'eaten')`),
    check(
      "log_entries_moment_ck",
      sql`${t.moment} in ('breakfast', 'lunch', 'snack', 'dinner')`,
    ),
    check("log_entries_servings_ck", sql`${t.servings} > 0`),
    index("log_entries_user_day_idx").on(t.userId, t.day), // "my day" queries
  ],
);

/**
 * The snapshot (ADR-0007): a frozen copy of each ingredient line as it was
 * when the entry was logged — name, unit, nutrients, price. `ingredient_id` is
 * kept only as a link for "show me the current ingredient"; it becomes null if
 * the ingredient is deleted, and the snapshot is unaffected.
 */
export const logEntryItems = pgTable(
  "log_entry_items",
  {
    id: idColumn(),
    userId: uuid("user_id").notNull(),
    entryId: uuid("entry_id").notNull(),
    ingredientId: uuid("ingredient_id").references(() => ingredients.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    unit: text("unit").$type<IngredientUnit>().notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2, mode: "string" }).notNull(),
    ...nutrientColumns(),
    packagePriceCents: integer("package_price_cents"),
    packageSize: numeric("package_size", { precision: 10, scale: 2, mode: "string" }),
    position: integer("position").notNull(),
  },
  (t) => [
    foreignKey({
      name: "log_entry_items_entry_fk",
      columns: [t.entryId, t.userId],
      foreignColumns: [logEntries.id, logEntries.userId],
    }).onDelete("cascade"),
    check("log_entry_items_quantity_ck", sql`${t.quantity} > 0`),
    index("log_entry_items_entry_idx").on(t.entryId),
  ],
);

/**
 * Per-user settings: one row, created on first save (until then, defaults
 * from core/nutrition/repositories/settings.ts apply).
 * - timezone: decides what "today" means (the server runs in UTC).
 * - locale: which i18n dictionary the UI uses.
 * - targets: daily objectives; null = no target for that nutrient.
 */
export const userSettings = pgTable(
  "user_settings",
  {
    userId: uuid("user_id")
      .primaryKey() // exactly one settings row per user
      .references(() => user.id, { onDelete: "cascade" }),
    timezone: text("timezone").notNull().default("Europe/Rome"),
    locale: text("locale").notNull().default("it"),
    // ADR-0010: the chosen theme (core/shared/themes.ts). Plain text like
    // locale; unknown values fall back to the default when read.
    theme: text("theme").notNull().default("label"),
    // Preferences (migration 0006). Recommended maxima for sugars, saturated
    // fat and salt when no target is set (core/nutrition/targets.ts).
    autoTargets: boolean("auto_targets").notNull().default(true),
    // Where lunch, snack and dinner start, in minutes after midnight
    // (ADR-0011 core/nutrition/moments.ts); breakfast is before lunch.
    lunchFrom: integer("lunch_from").notNull().default(660), // 11:00
    snackFrom: integer("snack_from").notNull().default(900), // 15:00
    dinnerFrom: integer("dinner_from").notNull().default(1110), // 18:30
    // Starting views: the trends period (days) and the food lists' sort.
    // Sort keys are validated by the app (unknown -> default when read).
    trendsRange: integer("trends_range").notNull().default(7),
    listSort: text("list_sort").notNull().default("used"),
    listPer: text("list_per").notNull().default("none"),
    // DEPRECATED since migration 0001 (ADR-0008): targets moved to
    // day_profiles; migration 0002 copied them into a "Standard" profile.
    // Nothing reads these columns any more. A later migration drops them,
    // once production has run on profiles for a while (additive-first: add,
    // backfill, switch reads, then remove — ADR-0004).
    ...targetColumns(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    check(
      "user_settings_moments_ck",
      sql`300 <= ${t.lunchFrom} and ${t.lunchFrom} < ${t.snackFrom} and ${t.snackFrom} < ${t.dinnerFrom} and ${t.dinnerFrom} < 1440`,
    ),
    check("user_settings_trends_range_ck", sql`${t.trendsRange} in (7, 30, 90)`),
  ],
);

/**
 * A kind of day with its own daily targets ("Palestra", "Corsa", "Riposo"),
 * defined by the user (ADR-0008: kinds are data, not code). At most one per
 * user is the default: the partial unique index below makes a second default
 * impossible, not just unlikely.
 */
export const dayProfiles = pgTable(
  "day_profiles",
  {
    id: idColumn(),
    userId: ownerColumn(),
    name: text("name").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    ...targetColumns(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    unique("day_profiles_user_name_uq").on(t.userId, t.name),
    // At most one row per user with is_default = true.
    uniqueIndex("day_profiles_one_default_uq")
      .on(t.userId)
      .where(sql`${t.isDefault}`),
  ],
);

/**
 * Which profile a given day follows, with a COPY of its targets (ADR-0008,
 * same reasoning as ADR-0007). Created when the user picks a profile for the
 * day, or automatically from the default profile when the first food of the
 * day is logged, so every day with food has frozen targets.
 * `profile_id` is only a link; it becomes null if the profile is deleted.
 */
export const dayPlans = pgTable(
  "day_plans",
  {
    userId: ownerColumn(),
    day: date("day", { mode: "string" }).notNull(),
    profileId: uuid("profile_id").references(() => dayProfiles.id, {
      onDelete: "set null",
    }),
    profileName: text("profile_name").notNull(), // the name at the time
    ...targetColumns(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);
