/**
 * core/db/schema/columns.ts — the column shapes every v2 table uses
 * (ADR-0057, v1's ADR-0003 rules):
 *   - primary keys are Postgres-generated UUIDs; timestamps have a time zone;
 *   - every table has `user_id`, children included, and every reference to
 *     another owned row is a composite key (id, user_id): the database refuses
 *     my row pointing at yours, whatever the code does;
 *   - numbers are exact `numeric`, handed to TypeScript as strings; money is
 *     integer cents.
 */
import { sql } from "drizzle-orm";
import { numeric, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const tstz = (name: string) => timestamp(name, { withTimezone: true });

export const idColumn = () =>
  uuid("id")
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey();

/** `user_id`: required; the rows go when the user is deleted. */
export const ownerColumn = () =>
  uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

/** A value of a field (a nutrient per 100 g, a weight, minutes): up to 10 digits and 4 decimals. */
export const value = (name: string) =>
  numeric(name, { precision: 14, scale: 4, mode: "string" });

/** A quantity (grams, servings, a package's size). */
export const quantity = (name: string) =>
  numeric(name, { precision: 10, scale: 2, mode: "string" });

/** How sure a value is, 0–1 (concepts §3). */
export const confidence = (name: string) =>
  numeric(name, { precision: 3, scale: 2, mode: "string" });

/** created_at / updated_at, as v1. */
export const timestamps = () => ({
  createdAt: tstz("created_at").defaultNow().notNull(),
  updatedAt: tstz("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
