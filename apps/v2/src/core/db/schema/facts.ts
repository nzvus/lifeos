/**
 * core/db/schema/facts.ts — what happened, or is planned (schema.md "Facts",
 * concepts §3). The hybrid rule (ADR-0053): facts are generic rows, and only
 * lines with snapshots, training sets and money movements get their own shape.
 *
 *   entries ─┬─< entry_values        one per field of the kind
 *            ├─< entry_lines ─< entry_line_values   the snapshot (ADR-0007)
 *            ├─< entry_links          fulfils / related / from_block
 *            ├─< training_sets        on a session's exercise entry
 *            └── money_movements ─< money_lines
 *   receipts, receipt_aliases         as v1
 *
 * `day` is the logical day (E1), stored for indexing: derived from start_at
 * and the day boundary, or set alone when the time is unknown.
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
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  confidence,
  idColumn,
  ownerColumn,
  quantity,
  timestamps,
  tstz,
  value,
} from "./columns";
import { catalogItems } from "./definitions";

export const STATUSES = ["planned", "done", "skipped"] as const;
export const SOURCES = [
  "typed",
  "quick",
  "timer",
  "device",
  "import",
  "template",
  "derived",
] as const;

export const entries = pgTable(
  "entries",
  {
    id: idColumn(),
    userId: ownerColumn(),
    /** A built-in kind's key (in code) or a user kind's key. */
    kind: text("kind").notNull(),
    startAt: tstz("start_at"),
    endAt: tstz("end_at"),
    day: date("day", { mode: "string" }).notNull(),
    status: text("status").$type<(typeof STATUSES)[number]>().notNull(),
    /** The entry it belongs to: a session's exercise belongs to the session. */
    parentId: uuid("parent_id"),
    /** The catalog item it is "of": the exercise, the habit, the book… */
    itemId: uuid("item_id"),
    source: text("source").$type<(typeof SOURCES)[number]>().notNull().default("typed"),
    confidence: confidence("confidence").notNull().default("1"),
    note: text("note").notNull().default(""),
    ...timestamps(),
    deletedAt: tstz("deleted_at"),
  },
  (t) => [
    unique("entries_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "entries_parent_fk",
      columns: [t.parentId, t.userId],
      foreignColumns: [t.id, t.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "entries_item_fk",
      columns: [t.itemId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("restrict"),
    check("entries_status_ck", sql`${t.status} in ('planned', 'done', 'skipped')`),
    check(
      "entries_source_ck",
      sql`${t.source} in ('typed', 'quick', 'timer', 'device', 'import', 'template', 'derived')`,
    ),
    check(
      "entries_span_ck",
      sql`${t.endAt} is null or ${t.startAt} is null or ${t.endAt} > ${t.startAt}`,
    ),
    check(
      "entries_end_needs_start_ck",
      sql`${t.endAt} is null or ${t.startAt} is not null`,
    ),
    check("entries_confidence_ck", sql`${t.confidence} >= 0 and ${t.confidence} <= 1`),
    index("entries_user_day_idx").on(t.userId, t.day),
    index("entries_user_kind_day_idx").on(t.userId, t.kind, t.day),
    index("entries_parent_idx").on(t.parentId),
  ],
);

/** One value per field of the entry's kind; exactly one of num, text, bool, ref is set. */
export const entryValues = pgTable(
  "entry_values",
  {
    userId: ownerColumn(),
    entryId: uuid("entry_id").notNull(),
    field: text("field").notNull(),
    num: value("num"),
    text: text("text"),
    bool: boolean("bool"),
    refItemId: uuid("ref_item_id"),
  },
  (t) => [
    primaryKey({ name: "entry_values_pk", columns: [t.entryId, t.field] }),
    foreignKey({
      name: "entry_values_entry_fk",
      columns: [t.entryId, t.userId],
      foreignColumns: [entries.id, entries.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "entry_values_ref_fk",
      columns: [t.refItemId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("restrict"),
    check(
      "entry_values_one_ck",
      sql`num_nonnulls(${t.num}, ${t.text}, ${t.bool}, ${t.refItemId}) = 1`,
    ),
  ],
);

/** A composite entry's lines: the meal's foods as eaten, with the product and format when known. */
export const entryLines = pgTable(
  "entry_lines",
  {
    id: idColumn(),
    userId: ownerColumn(),
    entryId: uuid("entry_id").notNull(),
    position: integer("position").notNull(),
    itemId: uuid("item_id"),
    productId: uuid("product_id"),
    formatId: uuid("format_id"),
    /** The name at logging time: the line reads right after a rename or a delete. */
    name: text("name").notNull(),
    quantity: quantity("quantity").notNull(),
    unit: text("unit").notNull(),
  },
  (t) => [
    unique("entry_lines_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "entry_lines_entry_fk",
      columns: [t.entryId, t.userId],
      foreignColumns: [entries.id, entries.userId],
    }).onDelete("cascade"),
    ...(["item", "product", "format"] as const).map((k) =>
      foreignKey({
        name: `entry_lines_${k}_fk`,
        columns: [
          k === "item" ? t.itemId : k === "product" ? t.productId : t.formatId,
          t.userId,
        ],
        foreignColumns: [catalogItems.id, catalogItems.userId],
      }).onDelete("restrict"),
    ),
    check("entry_lines_quantity_ck", sql`${t.quantity} > 0`),
    uniqueIndex("entry_lines_entry_position_uq").on(t.entryId, t.position),
  ],
);

/** The snapshot of the item's per-100 values at logging (ADR-0007): never rewritten by a catalog edit. */
export const entryLineValues = pgTable(
  "entry_line_values",
  {
    userId: ownerColumn(),
    lineId: uuid("line_id").notNull(),
    field: text("field").notNull(),
    num: value("num").notNull(),
  },
  (t) => [
    primaryKey({ name: "entry_line_values_pk", columns: [t.lineId, t.field] }),
    foreignKey({
      name: "entry_line_values_line_fk",
      columns: [t.lineId, t.userId],
      foreignColumns: [entryLines.id, entryLines.userId],
    }).onDelete("cascade"),
  ],
);

export const entryLinks = pgTable(
  "entry_links",
  {
    userId: ownerColumn(),
    fromId: uuid("from_id").notNull(),
    toId: uuid("to_id").notNull(),
    relation: text("relation").$type<"fulfils" | "related" | "from_block">().notNull(),
  },
  (t) => [
    primaryKey({ name: "entry_links_pk", columns: [t.fromId, t.toId, t.relation] }),
    foreignKey({
      name: "entry_links_from_fk",
      columns: [t.fromId, t.userId],
      foreignColumns: [entries.id, entries.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "entry_links_to_fk",
      columns: [t.toId, t.userId],
      foreignColumns: [entries.id, entries.userId],
    }).onDelete("cascade"),
    check(
      "entry_links_relation_ck",
      sql`${t.relation} in ('fulfils', 'related', 'from_block')`,
    ),
  ],
);

/** A session exercise's sets: timers and effort. e1RM is computed on read (E6). */
export const trainingSets = pgTable(
  "training_sets",
  {
    id: idColumn(),
    userId: ownerColumn(),
    entryId: uuid("entry_id").notNull(),
    position: integer("position").notNull(),
    reps: integer("reps"),
    /** Always the total (03 T-10). */
    loadKg: numeric("load_kg", { precision: 6, scale: 2, mode: "string" }),
    /** How it was typed. */
    loadEntry: text("load_entry")
      .$type<"total" | "per_dumbbell" | "per_side">()
      .notNull()
      .default("total"),
    rir: smallint("rir"),
    durationS: integer("duration_s"),
    warmup: boolean("warmup").notNull().default(false),
    side: text("side").$type<"left" | "right">(),
    startedAt: tstz("started_at"),
    endedAt: tstz("ended_at"),
    done: boolean("done").notNull().default(false),
  },
  (t) => [
    foreignKey({
      name: "training_sets_entry_fk",
      columns: [t.entryId, t.userId],
      foreignColumns: [entries.id, entries.userId],
    }).onDelete("cascade"),
    check("training_sets_reps_ck", sql`${t.reps} is null or ${t.reps} >= 0`),
    check("training_sets_load_ck", sql`${t.loadKg} is null or ${t.loadKg} >= 0`),
    check(
      "training_sets_rir_ck",
      sql`${t.rir} is null or (${t.rir} >= 0 and ${t.rir} <= 10)`,
    ),
    check(
      "training_sets_load_entry_ck",
      sql`${t.loadEntry} in ('total', 'per_dumbbell', 'per_side')`,
    ),
    check(
      "training_sets_side_ck",
      sql`${t.side} is null or ${t.side} in ('left', 'right')`,
    ),
    check(
      "training_sets_span_ck",
      sql`${t.endedAt} is null or ${t.startedAt} is null or ${t.endedAt} >= ${t.startedAt}`,
    ),
    uniqueIndex("training_sets_entry_position_uq").on(t.entryId, t.position),
  ],
);

export const receipts = pgTable(
  "receipts",
  {
    id: idColumn(),
    userId: ownerColumn(),
    day: date("day", { mode: "string" }).notNull(),
    shop: text("shop").notNull().default(""),
    /** The receipt as text, as pasted or read: kept as the source. */
    text: text("text").notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    deletedAt: tstz("deleted_at"),
  },
  (t) => [
    unique("receipts_id_user_uq").on(t.id, t.userId),
    index("receipts_user_day_idx").on(t.userId, t.day),
  ],
);

/** A movement entry's money: exact signed cents (spending < 0). Balances are computed. */
export const moneyMovements = pgTable(
  "money_movements",
  {
    entryId: uuid("entry_id").primaryKey(),
    userId: ownerColumn(),
    /** An account (catalog "account"); null is the default account until accounts exist. */
    accountId: uuid("account_id"),
    amountCents: integer("amount_cents").notNull(),
    categoryId: uuid("category_id"),
    shop: text("shop").notNull().default(""),
    method: text("method"),
    receiptId: uuid("receipt_id"),
  },
  (t) => [
    unique("money_movements_entry_user_uq").on(t.entryId, t.userId),
    foreignKey({
      name: "money_movements_entry_fk",
      columns: [t.entryId, t.userId],
      foreignColumns: [entries.id, entries.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "money_movements_account_fk",
      columns: [t.accountId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("restrict"),
    foreignKey({
      name: "money_movements_category_fk",
      columns: [t.categoryId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("restrict"),
    foreignKey({
      name: "money_movements_receipt_fk",
      columns: [t.receiptId, t.userId],
      foreignColumns: [receipts.id, receipts.userId],
    }).onDelete("restrict"),
  ],
);

export const moneyLines = pgTable(
  "money_lines",
  {
    id: idColumn(),
    userId: ownerColumn(),
    movementId: uuid("movement_id").notNull(),
    position: integer("position").notNull(),
    description: text("description").notNull(),
    quantity: quantity("quantity"),
    amountCents: integer("amount_cents").notNull(),
    productId: uuid("product_id"),
    /** The purchase entry this line bought, for the pantry. */
    purchaseEntryId: uuid("purchase_entry_id"),
  },
  (t) => [
    unique("money_lines_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "money_lines_movement_fk",
      columns: [t.movementId, t.userId],
      foreignColumns: [moneyMovements.entryId, moneyMovements.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "money_lines_product_fk",
      columns: [t.productId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("restrict"),
    foreignKey({
      name: "money_lines_purchase_fk",
      columns: [t.purchaseEntryId, t.userId],
      foreignColumns: [entries.id, entries.userId],
    }).onDelete("restrict"),
    uniqueIndex("money_lines_movement_position_uq").on(t.movementId, t.position),
  ],
);

export const receiptAliases = pgTable(
  "receipt_aliases",
  {
    id: idColumn(),
    userId: ownerColumn(),
    /** The receipt text, normalised. */
    key: text("key").notNull(),
    productId: uuid("product_id").notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("receipt_aliases_user_key_uq").on(t.userId, t.key),
    foreignKey({
      name: "receipt_aliases_product_fk",
      columns: [t.productId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("cascade"),
  ],
);
