/**
 * core/db/schema/plans.ts — models, goals and decisions (schema.md "Plans,
 * goals, decisions", concepts §5 and §7, E3).
 *
 *   templates ─┬─< template_blocks   a derived model stores only its differences:
 *              │                     base_block_id (changed fields) or removed
 *              ├─< cycle_steps       a cycle's steps, any models in order
 *              └── cycles_state      how a cycle advances
 *   week_layouts  weekday → model
 *   goals         a history by since_day
 *   decisions     what the person decided; never recomputed
 *
 * A cycle's next step is not stored: E3 derives it from the steps and what
 * was done (v1 ADR-0024: derived, never stored).
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { idColumn, ownerColumn, timestamps, tstz, value } from "./columns";
import { catalogItems } from "./definitions";

export const templates = pgTable(
  "templates",
  {
    id: idColumn(),
    userId: ownerColumn(),
    scope: text("scope").$type<"block" | "day" | "week" | "cycle">().notNull(),
    name: text("name").notNull(),
    extendsId: uuid("extends_id"),
    /** A habit: block + recurrence (E1 `Recurrence`). */
    recurrence: jsonb("recurrence"),
    /** A day model's targets: fixed numbers, or follow the goal (E5's parameters). */
    targets: jsonb("targets"),
    startDay: date("start_day", { mode: "string" }),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
    deletedAt: tstz("deleted_at"),
  },
  (t) => [
    unique("templates_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "templates_extends_fk",
      columns: [t.extendsId, t.userId],
      foreignColumns: [t.id, t.userId],
    }).onDelete("restrict"),
    check("templates_scope_ck", sql`${t.scope} in ('block', 'day', 'week', 'cycle')`),
    check(
      "templates_not_self_ck",
      sql`${t.extendsId} is null or ${t.extendsId} <> ${t.id}`,
    ),
  ],
);

export const templateBlocks = pgTable(
  "template_blocks",
  {
    id: idColumn(),
    userId: ownerColumn(),
    templateId: uuid("template_id").notNull(),
    position: integer("position").notNull(),
    kind: text("kind"),
    itemId: uuid("item_id"),
    /** E3 `When`; null on a changed inherited block that keeps the base's. */
    when: text("when").$type<
      "absolute" | "after_block" | "after_wake" | "before_bed" | "unset"
    >(),
    atMin: integer("at_min"),
    anchorBlockId: uuid("anchor_block_id"),
    offsetMin: integer("offset_min"),
    durationMin: integer("duration_min"),
    /** Bound to a cycle: the block takes the step due (E3). */
    cycleId: uuid("cycle_id"),
    kcalShare: numeric("kcal_share", { precision: 4, scale: 3, mode: "string" }),
    proteinShare: numeric("protein_share", { precision: 4, scale: 3, mode: "string" }),
    defaults: jsonb("defaults").$type<Record<string, unknown>>(),
    /** This row changes that inherited block (its non-null fields win), or hides it with `removed`. */
    baseBlockId: uuid("base_block_id"),
    removed: boolean("removed").notNull().default(false),
  },
  (t) => [
    unique("template_blocks_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "template_blocks_template_fk",
      columns: [t.templateId, t.userId],
      foreignColumns: [templates.id, templates.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "template_blocks_item_fk",
      columns: [t.itemId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("restrict"),
    foreignKey({
      name: "template_blocks_cycle_fk",
      columns: [t.cycleId, t.userId],
      foreignColumns: [templates.id, templates.userId],
    }).onDelete("restrict"),
    foreignKey({
      name: "template_blocks_anchor_fk",
      columns: [t.anchorBlockId, t.userId],
      foreignColumns: [t.id, t.userId],
    }).onDelete("restrict"),
    foreignKey({
      name: "template_blocks_base_fk",
      columns: [t.baseBlockId, t.userId],
      foreignColumns: [t.id, t.userId],
    }).onDelete("cascade"),
    check(
      "template_blocks_when_ck",
      sql`${t.when} is null or ${t.when} in ('absolute', 'after_block', 'after_wake', 'before_bed', 'unset')`,
    ),
    // A block of its own needs a kind and a when; a difference on a base block may leave them to the base.
    check(
      "template_blocks_own_ck",
      sql`${t.baseBlockId} is not null or (${t.kind} is not null and ${t.when} is not null)`,
    ),
    check(
      "template_blocks_removed_ck",
      sql`not ${t.removed} or ${t.baseBlockId} is not null`,
    ),
    check(
      "template_blocks_shares_ck",
      sql`(${t.kcalShare} is null or (${t.kcalShare} >= 0 and ${t.kcalShare} <= 1)) and (${t.proteinShare} is null or (${t.proteinShare} >= 0 and ${t.proteinShare} <= 1))`,
    ),
    index("template_blocks_template_idx").on(t.templateId),
  ],
);

export const cycleSteps = pgTable(
  "cycle_steps",
  {
    id: idColumn(),
    userId: ownerColumn(),
    cycleId: uuid("cycle_id").notNull(),
    position: integer("position").notNull(),
    /** The step's model, when the step is a day type; else its items (cycle_step_items); neither is a rest. */
    stepTemplateId: uuid("step_template_id"),
    /** What the step is called ("Push", "Riposo"); v1's slot label. */
    label: text("label").notNull().default(""),
  },
  (t) => [
    unique("cycle_steps_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "cycle_steps_cycle_fk",
      columns: [t.cycleId, t.userId],
      foreignColumns: [templates.id, templates.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "cycle_steps_step_fk",
      columns: [t.stepTemplateId, t.userId],
      foreignColumns: [templates.id, templates.userId],
    }).onDelete("restrict"),
    uniqueIndex("cycle_steps_cycle_position_uq").on(t.cycleId, t.position),
  ],
);

/** A step's items (routines, exercises, recipes): E3 `Step.keys`; an occurrence of any of them counts. */
export const cycleStepItems = pgTable(
  "cycle_step_items",
  {
    userId: ownerColumn(),
    stepId: uuid("step_id").notNull(),
    position: integer("position").notNull(),
    itemId: uuid("item_id").notNull(),
  },
  (t) => [
    primaryKey({ name: "cycle_step_items_pk", columns: [t.stepId, t.position] }),
    foreignKey({
      name: "cycle_step_items_step_fk",
      columns: [t.stepId, t.userId],
      foreignColumns: [cycleSteps.id, cycleSteps.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "cycle_step_items_item_fk",
      columns: [t.itemId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("restrict"),
  ],
);

export const cyclesState = pgTable(
  "cycles_state",
  {
    cycleId: uuid("cycle_id").primaryKey(),
    userId: ownerColumn(),
    advance: text("advance")
      .$type<"occurrence" | "date">()
      .notNull()
      .default("occurrence"),
    onSkip: text("on_skip").$type<"shift" | "lose">().notNull().default("lose"),
  },
  (t) => [
    foreignKey({
      name: "cycles_state_cycle_fk",
      columns: [t.cycleId, t.userId],
      foreignColumns: [templates.id, templates.userId],
    }).onDelete("cascade"),
    check("cycles_state_advance_ck", sql`${t.advance} in ('occurrence', 'date')`),
    check("cycles_state_on_skip_ck", sql`${t.onSkip} in ('shift', 'lose')`),
  ],
);

export const weekLayouts = pgTable(
  "week_layouts",
  {
    userId: ownerColumn(),
    /** ISO weekday, Monday 1 … Sunday 7. */
    weekday: smallint("weekday").notNull(),
    templateId: uuid("template_id").notNull(),
  },
  (t) => [
    primaryKey({ name: "week_layouts_pk", columns: [t.userId, t.weekday] }),
    foreignKey({
      name: "week_layouts_template_fk",
      columns: [t.templateId, t.userId],
      foreignColumns: [templates.id, templates.userId],
    }).onDelete("cascade"),
    check("week_layouts_weekday_ck", sql`${t.weekday} between 1 and 7`),
  ],
);

/** A goal on a metric (E2 definition); a change starts a new row from a day, past days keep theirs. */
export const goals = pgTable(
  "goals",
  {
    id: idColumn(),
    userId: ownerColumn(),
    metric: jsonb("metric").notNull(),
    target: text("target").$type<"at_least" | "at_most" | "range" | "reach">().notNull(),
    value: value("value"),
    low: value("low"),
    high: value("high"),
    byDate: date("by_date", { mode: "string" }),
    sinceDay: date("since_day", { mode: "string" }).notNull(),
    untilDay: date("until_day", { mode: "string" }),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    check(
      "goals_target_ck",
      sql`${t.target} in ('at_least', 'at_most', 'range', 'reach')`,
    ),
    check(
      "goals_values_ck",
      sql`(${t.target} = 'range' and ${t.low} is not null and ${t.high} is not null and ${t.low} <= ${t.high}) or (${t.target} <> 'range' and ${t.value} is not null)`,
    ),
    check("goals_until_ck", sql`${t.untilDay} is null or ${t.untilDay} >= ${t.sinceDay}`),
    index("goals_user_since_idx").on(t.userId, t.sinceDay),
  ],
);

export const DECISION_KINDS = [
  "day_closed",
  "week_targets",
  "day_targets",
  "cycle_override",
  "cycle_skip",
  "habit_excused",
] as const;

export const decisions = pgTable(
  "decisions",
  {
    userId: ownerColumn(),
    kind: text("kind").$type<(typeof DECISION_KINDS)[number]>().notNull(),
    day: date("day", { mode: "string" }).notNull(),
    /** What it is about on that day (a cycle's id, a habit's id), "" when the day says it all. */
    key: text("key").notNull().default(""),
    payload: jsonb("payload").notNull().default({}),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ name: "decisions_pk", columns: [t.userId, t.kind, t.day, t.key] }),
    check(
      "decisions_kind_ck",
      sql`${t.kind} in ('day_closed', 'week_targets', 'day_targets', 'cycle_override', 'cycle_skip', 'habit_excused')`,
    ),
  ],
);
