/**
 * core/db/schema/definitions.ts — what can be tracked and the catalogs
 * (schema.md "Definitions", concepts §2 and §4, ADR-0055).
 *
 *   kinds              the user's own kinds only; built-ins live in code
 *   catalog_items ─┬─< catalog_values   a food's nutrients per 100 g are rows
 *                  ├─< catalog_parts    a recipe's foods, a routine's exercises
 *                  └─< price_observations (on a format)
 *   food ─< product ─< format           parent_id; values resolve format › product › food
 *
 * Deleting is soft (`deleted_at`, the 30-day trash); references between
 * items are `restrict`, so the purge removes children first.
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
  pgTable,
  primaryKey,
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

export const kinds = pgTable(
  "kinds",
  {
    id: idColumn(),
    userId: ownerColumn(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    icon: text("icon").notNull().default(""),
    colour: text("colour").notNull().default(""),
    shape: text("shape").$type<"instant" | "interval">().notNull(),
    entryMode: text("entry_mode").notNull().default("form"),
    /** Fields, metrics, targets, relations: checked by the same type as the built-ins. */
    definition: jsonb("definition").notNull(),
    archivedAt: tstz("archived_at"),
    ...timestamps(),
  },
  (t) => [
    unique("kinds_id_user_uq").on(t.id, t.userId),
    uniqueIndex("kinds_user_key_uq").on(t.userId, t.key),
    check("kinds_shape_ck", sql`${t.shape} in ('instant', 'interval')`),
  ],
);

/**
 * Anything in a catalog: foods, products, formats, recipes, exercises, routines, habits, projects,
 * books, money categories, accounts, tags, rating factors… `catalog` says which.
 */
export const catalogItems = pgTable(
  "catalog_items",
  {
    id: idColumn(),
    userId: ownerColumn(),
    catalog: text("catalog").notNull(),
    name: text("name").notNull(),
    /** A product's food, a format's product, a category's parent. */
    parentId: uuid("parent_id"),
    /** Copied from another item ("duplica"). */
    basedOnId: uuid("based_on_id"),
    archivedAt: tstz("archived_at"),
    deletedAt: tstz("deleted_at"),
    ...timestamps(),
  },
  (t) => [
    unique("catalog_items_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "catalog_items_parent_fk",
      columns: [t.parentId, t.userId],
      foreignColumns: [t.id, t.userId],
    }).onDelete("restrict"),
    foreignKey({
      name: "catalog_items_based_on_fk",
      columns: [t.basedOnId, t.userId],
      foreignColumns: [t.id, t.userId],
    }).onDelete("restrict"),
    // One live name per catalog and parent: two products may both have a "500 g" format.
    uniqueIndex("catalog_items_live_name_uq")
      .on(
        t.userId,
        t.catalog,
        sql`coalesce(${t.parentId}, '00000000-0000-0000-0000-000000000000'::uuid)`,
        sql`lower(${t.name})`,
      )
      .where(sql`${t.deletedAt} is null`),
    index("catalog_items_user_catalog_idx").on(t.userId, t.catalog),
    index("catalog_items_parent_idx").on(t.parentId),
  ],
);

/** One value per field of an item; exactly one of num, text, bool, ref is set. */
export const catalogValues = pgTable(
  "catalog_values",
  {
    userId: ownerColumn(),
    itemId: uuid("item_id").notNull(),
    field: text("field").notNull(),
    num: value("num"),
    text: text("text"),
    bool: boolean("bool"),
    refItemId: uuid("ref_item_id"),
    unit: text("unit"),
    /** Where the value comes from: the label, CIQUAL, USDA FDC, a rule, v1… */
    source: text("source").notNull().default("typed"),
    confidence: confidence("confidence").notNull().default("1"),
  },
  (t) => [
    primaryKey({ name: "catalog_values_pk", columns: [t.itemId, t.field] }),
    foreignKey({
      name: "catalog_values_item_fk",
      columns: [t.itemId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "catalog_values_ref_fk",
      columns: [t.refItemId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("restrict"),
    check(
      "catalog_values_one_ck",
      sql`num_nonnulls(${t.num}, ${t.text}, ${t.bool}, ${t.refItemId}) = 1`,
    ),
    check(
      "catalog_values_confidence_ck",
      sql`${t.confidence} >= 0 and ${t.confidence} <= 1`,
    ),
  ],
);

/** The price history of a format: price per g = cents ÷ package_qty. */
export const priceObservations = pgTable(
  "price_observations",
  {
    id: idColumn(),
    userId: ownerColumn(),
    formatId: uuid("format_id").notNull(),
    shop: text("shop").notNull().default(""),
    day: date("day", { mode: "string" }).notNull(),
    cents: integer("cents").notNull(),
    packageQty: quantity("package_qty").notNull(),
    unit: text("unit").notNull(),
    source: text("source").$type<"receipt" | "manual" | "import">().notNull(),
    /**
     * The receipt line it came from, when it did (money_lines). No foreign key on purpose: the
     * price stays in the history after its receipt is purged; the repository checks the owner.
     */
    receiptLineId: uuid("receipt_line_id"),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      name: "price_observations_format_fk",
      columns: [t.formatId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("cascade"),
    check("price_observations_cents_ck", sql`${t.cents} >= 0`),
    check("price_observations_qty_ck", sql`${t.packageQty} > 0`),
    check(
      "price_observations_source_ck",
      sql`${t.source} in ('receipt', 'manual', 'import')`,
    ),
    index("price_observations_format_day_idx").on(t.formatId, t.day),
  ],
);

/** The parts of an item: a recipe's foods, a routine's exercises (with their default sets, reps, load, rest). */
export const catalogParts = pgTable(
  "catalog_parts",
  {
    userId: ownerColumn(),
    itemId: uuid("item_id").notNull(),
    position: integer("position").notNull(),
    partItemId: uuid("part_item_id").notNull(),
    quantity: quantity("quantity"),
    unit: text("unit"),
    defaults: jsonb("defaults").$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [
    primaryKey({ name: "catalog_parts_pk", columns: [t.itemId, t.position] }),
    foreignKey({
      name: "catalog_parts_item_fk",
      columns: [t.itemId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "catalog_parts_part_fk",
      columns: [t.partItemId, t.userId],
      foreignColumns: [catalogItems.id, catalogItems.userId],
    }).onDelete("restrict"),
    check("catalog_parts_quantity_ck", sql`${t.quantity} is null or ${t.quantity} > 0`),
    index("catalog_parts_part_idx").on(t.partItemId),
  ],
);
