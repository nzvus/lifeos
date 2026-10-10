/**
 * core/db/schema/dayprograms.ts — a day type's program (ADR-0044).
 *
 *   day_profiles ─┬── day_programs       (0..1: the usual training time and
 *                 │                       the ± kcal shift in a check-in week)
 *                 └─< day_program_slots  (timed meal slots: kind, time, soft
 *                                         shares of kcal and protein)
 *
 * A template, read live: entries keep their own moment and time
 * (ADR-0011), so editing a type rewrites no past day. Times are minutes
 * after midnight. Owner-filtered by user_id; removed with their type.
 * New tables: safe in any merge order (ADR-0003).
 */
import { sql } from "drizzle-orm";
import {
  check,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Moment } from "../../nutrition/moments";
import { user } from "./auth";
import { dayProfiles } from "./nutrition";

const owner = () =>
  uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });
const profile = () =>
  uuid("profile_id")
    .notNull()
    .references(() => dayProfiles.id, { onDelete: "cascade" });

export const dayPrograms = pgTable(
  "day_programs",
  {
    profileId: profile().primaryKey(),
    userId: owner(),
    /** When the day's training usually starts; null = no training. */
    trainingAt: integer("training_at"),
    /** kcal above (+) or below (−) the week's average in a check-in week. */
    shiftKcal: integer("shift_kcal").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    check("day_programs_training_at_ck", sql`${t.trainingAt} between 0 and 1439`),
    check("day_programs_shift_ck", sql`${t.shiftKcal} between -1000 and 1000`),
  ],
);

export const dayProgramSlots = pgTable(
  "day_program_slots",
  {
    profileId: profile(),
    position: integer("position").notNull(),
    userId: owner(),
    kind: text("kind").$type<Moment>().notNull(),
    at: integer("at").notNull(),
    /** Soft shares of the day (0–1); null = no hint. */
    kcalShare: numeric("kcal_share", { precision: 3, scale: 2, mode: "string" }),
    proteinShare: numeric("protein_share", { precision: 3, scale: 2, mode: "string" }),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.position] }),
    check(
      "day_program_slots_kind_ck",
      sql`${t.kind} in ('breakfast', 'lunch', 'snack', 'dinner', 'pre_workout', 'post_workout', 'pre_sleep')`,
    ),
    check("day_program_slots_at_ck", sql`${t.at} between 0 and 1439`),
    check(
      "day_program_slots_share_ck",
      sql`coalesce(${t.kcalShare}, 0) between 0 and 1 and coalesce(${t.proteinShare}, 0) between 0 and 1`,
    ),
  ],
);
