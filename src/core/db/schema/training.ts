/**
 * core/db/schema/training.ts — the training module (ADR-0005).
 *
 *   exercises ─< routine_items >─ routines          (templates: PUSH, Upper…)
 *   exercises ─< session_exercises >─ training_sessions
 *                     └─< sets                      (typed columns)
 *   body_measurements                               (weight for burn estimates)
 *
 * Same rules as nutrition.ts: every table has user_id; child tables reach
 * their parents through composite (id, user_id) keys, so rows of two users
 * can never be linked; numbers are exact numerics. Sessions REFERENCE their
 * exercises (identity, ADR-0005), unlike food log entries (snapshots,
 * ADR-0007): renaming an exercise carries its whole progression.
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
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { ExerciseKind, SessionStatus } from "../../training/kinds";
import { user } from "./auth";

const tstz = (name: string) => timestamp(name, { withTimezone: true });
const idColumn = () =>
  uuid("id")
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey();
const ownerColumn = () =>
  uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

/** An exercise as the user names it ("Lat pulldown"): an identity. */
export const exercises = pgTable(
  "exercises",
  {
    id: idColumn(),
    userId: ownerColumn(),
    name: text("name").notNull(),
    kind: text("kind").$type<ExerciseKind>().notNull(),
    muscleGroups: text("muscle_groups")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    equipment: text("equipment"),
    unilateral: boolean("unilateral").notNull().default(false),
    notes: text("notes").notNull().default(""),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("exercises_user_name_uq").on(t.userId, t.name),
    unique("exercises_id_user_uq").on(t.id, t.userId),
    check("exercises_kind_ck", sql`${t.kind} in ('strength', 'bodyweight', 'cardio')`),
  ],
);

/** A template session ("PUSH", "Upper A"). */
export const routines = pgTable(
  "routines",
  {
    id: idColumn(),
    userId: ownerColumn(),
    name: text("name").notNull(),
    notes: text("notes").notNull().default(""),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    unique("routines_user_name_uq").on(t.userId, t.name),
    unique("routines_id_user_uq").on(t.id, t.userId),
  ],
);

/** One exercise of a routine, with its default sets. */
export const routineItems = pgTable(
  "routine_items",
  {
    id: idColumn(),
    userId: uuid("user_id").notNull(),
    routineId: uuid("routine_id").notNull(),
    exerciseId: uuid("exercise_id").notNull(),
    position: integer("position").notNull(),
    sets: integer("sets").notNull().default(3),
    reps: integer("reps"),
    loadKg: numeric("load_kg", { precision: 6, scale: 2, mode: "string" }),
    durationS: integer("duration_s"),
    restS: integer("rest_s"),
  },
  (t) => [
    foreignKey({
      name: "routine_items_routine_fk",
      columns: [t.routineId, t.userId],
      foreignColumns: [routines.id, routines.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "routine_items_exercise_fk",
      columns: [t.exerciseId, t.userId],
      foreignColumns: [exercises.id, exercises.userId],
    }).onDelete("restrict"), // an exercise in a routine can't vanish silently
    check("routine_items_sets_ck", sql`${t.sets} > 0`),
    index("routine_items_routine_idx").on(t.routineId),
  ],
);

/** A training session on a day: planned or done (like food, ADR-0009). */
export const trainingSessions = pgTable(
  "training_sessions",
  {
    id: idColumn(),
    userId: ownerColumn(),
    day: date("day", { mode: "string" }).notNull(),
    // What it was called ("PUSH 4"): free text, kept as written.
    label: text("label").notNull(),
    status: text("status").$type<SessionStatus>().notNull().default("done"),
    startedAt: tstz("started_at"),
    durationMin: integer("duration_min"),
    // The routine it was started from; the session stands on its own after.
    routineId: uuid("routine_id").references(() => routines.id, { onDelete: "set null" }),
    notes: text("notes").notNull().default(""),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("training_sessions_id_user_uq").on(t.id, t.userId),
    check("training_sessions_status_ck", sql`${t.status} in ('planned', 'done')`),
    check("training_sessions_duration_ck", sql`${t.durationMin} > 0`),
    index("training_sessions_user_day_idx").on(t.userId, t.day),
  ],
);

/** An exercise inside a session, in order, with its own notes and rest. */
export const sessionExercises = pgTable(
  "session_exercises",
  {
    id: idColumn(),
    userId: uuid("user_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    exerciseId: uuid("exercise_id").notNull(),
    position: integer("position").notNull(),
    restS: integer("rest_s"),
    notes: text("notes").notNull().default(""),
  },
  (t) => [
    unique("session_exercises_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "session_exercises_session_fk",
      columns: [t.sessionId, t.userId],
      foreignColumns: [trainingSessions.id, trainingSessions.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "session_exercises_exercise_fk",
      columns: [t.exerciseId, t.userId],
      foreignColumns: [exercises.id, exercises.userId],
    }).onDelete("restrict"), // history can't lose its exercise; merge instead
    index("session_exercises_session_idx").on(t.sessionId),
  ],
);

/**
 * One set. Typed columns (ADR-0005 option A); which apply depends on the
 * exercise's kind (checked by core validation). `load_kg` is the total used
 * for arithmetic, `load_text` the load as written ("2×7,5 + asta"),
 * `load_approx` true when part of it is unknown (a bar of unknown weight).
 */
export const sets = pgTable(
  "sets",
  {
    id: idColumn(),
    userId: uuid("user_id").notNull(),
    sessionExerciseId: uuid("session_exercise_id").notNull(),
    position: integer("position").notNull(),
    reps: integer("reps"),
    loadKg: numeric("load_kg", { precision: 6, scale: 2, mode: "string" }),
    loadText: text("load_text"),
    loadApprox: boolean("load_approx").notNull().default(false),
    durationS: integer("duration_s"),
    distanceM: integer("distance_m"),
    speedKmh: numeric("speed_kmh", { precision: 4, scale: 1, mode: "string" }),
    inclinePct: numeric("incline_pct", { precision: 4, scale: 1, mode: "string" }),
    restS: integer("rest_s"),
    warmup: boolean("warmup").notNull().default(false),
  },
  (t) => [
    foreignKey({
      name: "sets_session_exercise_fk",
      columns: [t.sessionExerciseId, t.userId],
      foreignColumns: [sessionExercises.id, sessionExercises.userId],
    }).onDelete("cascade"),
    // What a row alone can guarantee; per-kind rules are core validation.
    check("sets_measure_ck", sql`${t.reps} is not null or ${t.durationS} is not null`),
    check(
      "sets_positive_ck",
      sql`coalesce(${t.reps}, 1) > 0 and coalesce(${t.loadKg}, 0) >= 0 and coalesce(${t.durationS}, 1) > 0 and coalesce(${t.distanceM}, 0) >= 0`,
    ),
    index("sets_session_exercise_idx").on(t.sessionExerciseId),
  ],
);

/** A body measurement (weight for burn estimates; FitForge's are imported). */
export const bodyMeasurements = pgTable(
  "body_measurements",
  {
    id: idColumn(),
    userId: ownerColumn(),
    day: date("day", { mode: "string" }).notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2, mode: "string" }),
    bodyFatPct: numeric("body_fat_pct", { precision: 4, scale: 1, mode: "string" }),
    waistCm: numeric("waist_cm", { precision: 5, scale: 1, mode: "string" }),
    abdomenCm: numeric("abdomen_cm", { precision: 5, scale: 1, mode: "string" }),
    neckCm: numeric("neck_cm", { precision: 5, scale: 1, mode: "string" }),
    hipCm: numeric("hip_cm", { precision: 5, scale: 1, mode: "string" }),
    notes: text("notes").notNull().default(""),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    check("body_measurements_weight_ck", sql`${t.weightKg} > 0`),
    check("body_measurements_fat_ck", sql`${t.bodyFatPct} between 0 and 70`),
    index("body_measurements_user_day_idx").on(t.userId, t.day),
  ],
);
