/**
 * core/db/schema/closures.ts — closing a day (ADR-0042): the user says
 * whether what they logged is what they ate. "complete": the log is the
 * day (more or less); "partial": something is missing. No row = not
 * closed. What you spend is learnt from it (core/energy/calibration.ts):
 * a complete day is trusted, a partial one is not read as a deficit.
 * A new table: safe in any merge order (ADR-0003).
 */
import { sql } from "drizzle-orm";
import {
  check,
  date,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const CLOSURE_STATES = ["complete", "partial"] as const;
export type ClosureState = (typeof CLOSURE_STATES)[number];

export const dayClosures = pgTable(
  "day_closures",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    state: text("state").$type<ClosureState>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.day] }),
    check("day_closures_state_ck", sql`${t.state} in ('complete', 'partial')`),
  ],
);
