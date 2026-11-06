/**
 * core/db/schema/account.ts — one row of settings per person (schema.md
 * "Account"). v1's `target_*` and `energy_correction` are gone: targets come
 * from goals (E5) and the factor is learnt (E4).
 */
import { sql } from "drizzle-orm";
import { check, integer, jsonb, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { timestamps } from "./columns";

/** Display preferences (list sorts, periods…), checked by a zod type in the repository. */
export type Prefs = Record<string, unknown>;

export const settings = pgTable(
  "settings",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Decides what "today" means; never the server's clock. */
    timezone: text("timezone").notNull().default("Europe/Rome"),
    locale: text("locale").notNull().default("it"),
    theme: text("theme").notNull().default("label"),
    density: text("density").notNull().default("compact"),
    /** Minutes after local midnight when the logical day starts (E1); 04:00 by default. */
    dayBoundaryMin: integer("day_boundary_min").notNull().default(240),
    sex: text("sex").$type<"male" | "female">(),
    birthYear: integer("birth_year"),
    heightCm: numeric("height_cm", { precision: 5, scale: 1, mode: "string" }),
    prefs: jsonb("prefs").$type<Prefs>().notNull().default({}),
    ...timestamps(),
  },
  (t) => [
    check(
      "settings_boundary_ck",
      sql`${t.dayBoundaryMin} >= 0 and ${t.dayBoundaryMin} < 1440`,
    ),
    check("settings_sex_ck", sql`${t.sex} is null or ${t.sex} in ('male', 'female')`),
  ],
);
