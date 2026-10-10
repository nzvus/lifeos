/**
 * core/db/schema/goals.ts — the goal and the weekly check-in (ADR-0043).
 *
 *   goals          a history, like energy_corrections (ADR-0026): the goal
 *                  in force on a day is the latest with since_day ≤ that
 *                  day, so changing it never rewrites past days. The one
 *                  source of the rate; the day type's deficit is read only
 *                  without a goal.
 *   week_checkins  one row per check-in: "accepted" freezes the week's
 *                  targets (the same each day, start_day … start_day + 6);
 *                  "skipped" holds no numbers. Accepted rows are never
 *                  updated: a check-in done again starts a new row.
 *
 *   week_checkin_days  ADR-0044: an accepted check-in's per-day shift (kcal
 *                  above or below the week's average, from each day's
 *                  program; the week's total unchanged). Frozen with it:
 *                  editing a program later changes no fixed week.
 *
 * New tables: safe in any merge order (ADR-0003).
 */
import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * ADR-0045: what the goal is for. The rate follows from it, the target
 * weight and the day (core/energy/goal.ts planGoal), within ranges per kind.
 * Null = a goal from before ADR-0045: its stored rate applies as it is.
 */
export const GOAL_KINDS = ["lose", "gain", "recomp", "maintain"] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];
export const KCAL_FLOORS = ["standard", "low"] as const;
export type KcalFloor = (typeof KCAL_FLOORS)[number];
export const PROTEIN_PREFERENCES = ["low", "moderate", "high", "extra"] as const;
export type ProteinPreference = (typeof PROTEIN_PREFERENCES)[number];
export const DIET_SPLITS = ["balanced", "low_fat", "low_carb"] as const;
export type DietSplit = (typeof DIET_SPLITS)[number];
export const CHECKIN_DECISIONS = ["accepted", "skipped"] as const;
export type CheckinDecision = (typeof CHECKIN_DECISIONS)[number];

const inList = (values: readonly string[]) =>
  sql.raw(values.map((v) => `'${v}'`).join(", "));

export const goals = pgTable(
  "goals",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sinceDay: date("since_day", { mode: "string" }).notNull(),
    /** % of body weight a week, signed: −0.5 = lose 0.5 % a week. */
    ratePctWeek: numeric("rate_pct_week", {
      precision: 3,
      scale: 2,
      mode: "string",
    }).notNull(),
    kind: text("kind").$type<GoalKind>(),
    /** Optional; protein is per kg of it when set. */
    targetKg: numeric("target_kg", { precision: 5, scale: 2, mode: "string" }),
    /** Optional: by when the target weight should be reached (ADR-0045). */
    targetDay: date("target_day", { mode: "string" }),
    kcalFloor: text("kcal_floor").$type<KcalFloor>().notNull().default("standard"),
    protein: text("protein").$type<ProteinPreference>().notNull().default("moderate"),
    split: text("split").$type<DietSplit>().notNull().default("balanced"),
    /** 0 = Sunday … 6 = Saturday (Date.getUTCDay); Monday by default. */
    checkInWeekday: integer("check_in_weekday").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.sinceDay] }),
    check("goals_rate_ck", sql`${t.ratePctWeek} between -1.5 and 1.0`),
    check("goals_kind_ck", sql`${t.kind} in (${inList(GOAL_KINDS)})`),
    check("goals_target_kg_ck", sql`${t.targetKg} between 30 and 300`),
    check("goals_kcal_floor_ck", sql`${t.kcalFloor} in (${inList(KCAL_FLOORS)})`),
    check("goals_protein_ck", sql`${t.protein} in (${inList(PROTEIN_PREFERENCES)})`),
    check("goals_split_ck", sql`${t.split} in (${inList(DIET_SPLITS)})`),
    check("goals_weekday_ck", sql`${t.checkInWeekday} between 0 and 6`),
  ],
);

export const weekCheckins = pgTable(
  "week_checkins",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startDay: date("start_day", { mode: "string" }).notNull(),
    decision: text("decision").$type<CheckinDecision>().notNull(),
    /** What it was built from: kcal/day spent, the factor, the trend weight. */
    expenditureKcal: integer("expenditure_kcal"),
    factor: numeric("factor", { precision: 3, scale: 2, mode: "string" }),
    trendKg: numeric("trend_kg", { precision: 5, scale: 2, mode: "string" }),
    /** The week's targets, the same each day; null when skipped. */
    kcal: integer("kcal"),
    protein: integer("protein"),
    fat: integer("fat"),
    carbs: integer("carbs"),
    fiber: integer("fiber"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.startDay] }),
    check(
      "week_checkins_decision_ck",
      sql`${t.decision} in (${inList(CHECKIN_DECISIONS)})`,
    ),
    // Accepted ⇔ the numbers are there.
    check(
      "week_checkins_numbers_ck",
      sql`(${t.decision} = 'accepted') = (${t.kcal} is not null and ${t.protein} is not null and ${t.fat} is not null and ${t.carbs} is not null and ${t.fiber} is not null)`,
    ),
    check("week_checkins_kcal_ck", sql`${t.kcal} between 800 and 6000`),
    check("week_checkins_factor_ck", sql`${t.factor} between 0.80 and 1.20`),
  ],
);

export const weekCheckinDays = pgTable(
  "week_checkin_days",
  {
    userId: uuid("user_id").notNull(),
    startDay: date("start_day", { mode: "string" }).notNull(),
    day: date("day", { mode: "string" }).notNull(),
    /** kcal added to (or taken from) the week's average on this day. */
    shiftKcal: integer("shift_kcal").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.startDay, t.day] }),
    foreignKey({
      name: "week_checkin_days_checkin_fk",
      columns: [t.userId, t.startDay],
      foreignColumns: [weekCheckins.userId, weekCheckins.startDay],
    }).onDelete("cascade"),
    check("week_checkin_days_shift_ck", sql`${t.shiftKcal} between -2000 and 2000`),
  ],
);
