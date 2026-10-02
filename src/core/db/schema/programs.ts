/**
 * core/db/schema/programs.ts — training programs as an ordered cycle
 * (ADR-0024): a program is a sequence of slots (a routine, or rest) that
 * starts on a day. What comes next is DERIVED from the slots and the
 * sessions actually done — never stored — so skipping a day just moves
 * the cycle forward, like stock in the pantry (ADR-0017).
 *
 *   programs ──< program_slots ──> routines (null = rest)
 *                       └── program_slot_exercises ──> exercises (one, instead)
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { exercises, routines } from "./training";

const tstz = (name: string) => timestamp(name, { withTimezone: true });
const idColumn = () =>
  uuid("id")
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey();
const ownerColumn = () =>
  uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

export const programs = pgTable(
  "programs",
  {
    id: idColumn(),
    userId: ownerColumn(),
    name: text("name").notNull(),
    notes: text("notes").notNull().default(""),
    /** The first slot falls on this day. */
    startDay: date("start_day", { mode: "string" }).notNull(),
    /** At most one active program: the one that plans the coming days. */
    active: boolean("active").notNull().default(true),
    createdAt: tstz("created_at").defaultNow().notNull(),
    // ADR-0015: in the trash since then (null = live).
    deletedAt: tstz("deleted_at"),
  },
  (t) => [
    unique("programs_id_user_uq").on(t.id, t.userId),
    uniqueIndex("programs_one_active_uq")
      .on(t.userId)
      .where(sql`${t.active} and ${t.deletedAt} is null`),
  ],
);

export const programSlots = pgTable(
  "program_slots",
  {
    id: idColumn(),
    userId: uuid("user_id").notNull(),
    programId: uuid("program_id").notNull(),
    position: integer("position").notNull(),
    /** The routine of this slot; null = a rest day. Owner checked in core. */
    routineId: uuid("routine_id").references(() => routines.id, { onDelete: "set null" }),
    /** Shown for a rest slot, or when the routine was deleted. */
    label: text("label").notNull().default(""),
  },
  (t) => [
    foreignKey({
      name: "program_slots_program_fk",
      columns: [t.programId, t.userId],
      foreignColumns: [programs.id, programs.userId],
    }).onDelete("cascade"),
    unique("program_slots_position_uq").on(t.programId, t.position),
    check("program_slots_position_ck", sql`${t.position} >= 0`),
    index("program_slots_program_idx").on(t.programId),
  ],
);

/**
 * A slot can hold ONE exercise instead of a routine (a run, the treadmill).
 * A table of its own, not a column on program_slots: adding it is safe to
 * merge before the migration runs (no existing query changes).
 */
export const programSlotExercises = pgTable(
  "program_slot_exercises",
  {
    id: idColumn(),
    userId: uuid("user_id").notNull(),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => programSlots.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
  },
  (t) => [unique("program_slot_exercises_slot_uq").on(t.slotId)],
);

/**
 * ADR-0029: a change to one coming day of a program — "on this day, this
 * slot" (by position), or rest (null). The plan is still derived (ADR-0024);
 * overrides are placed first. A table of its own: safe before or after the
 * migration. Saving the program's slots clears them (positions change).
 */
export const programOverrides = pgTable(
  "program_overrides",
  {
    userId: ownerColumn(),
    programId: uuid("program_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    /** The slot to do that day; null = rest. */
    slotPosition: integer("slot_position"),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.programId, t.day] }),
    foreignKey({
      name: "program_overrides_program_fk",
      columns: [t.programId, t.userId],
      foreignColumns: [programs.id, programs.userId],
    }).onDelete("cascade"),
    check("program_overrides_position_ck", sql`${t.slotPosition} >= 0`),
  ],
);
