/**
 * core/db/schema/mind.ts — Mind (ADR-0038): the day as it felt. One row per
 * user and day: mood, energy and stress on 1–5 (null = not said) and a
 * note, the diary's line. A new table: safe in any merge order.
 */
import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const dayCheckins = pgTable(
  "day_checkins",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    mood: integer("mood"),
    energy: integer("energy"),
    stress: integer("stress"),
    note: text("note").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.day] }),
    check(
      "day_checkins_scale_ck",
      sql`coalesce(${t.mood}, 3) between 1 and 5 and coalesce(${t.energy}, 3) between 1 and 5 and coalesce(${t.stress}, 3) between 1 and 5`,
    ),
  ],
);
