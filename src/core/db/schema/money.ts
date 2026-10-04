/**
 * core/db/schema/money.ts — Money (ADR-0036): ONE ledger of movements.
 *
 *   money_categories   two levels (a parent and its children), expense or
 *                      income; a starter set per account, editable
 *   money_movements    every euro in or out: a day, a signed amount in
 *                      integer cents (spending < 0), a category, free tags,
 *                      a payment method, a shop, a description
 *   money_receipts     a receipt's TEXT (pasted or read on the phone), the
 *                      source of one movement
 *   money_lines        a receipt's lines; a product line points to the
 *                      pantry purchase it became (ADR-0017 stock unchanged)
 *   receipt_aliases    "PASSATA MUTTI 700G" → my product: the next receipt
 *                      needs no model for it
 *
 * Money is exact: integer cents, never floats. Deletes go to the trash
 * (ADR-0015). Composite foreign keys keep every link inside one account.
 * Their "set null" is written in the SQL as SET NULL (<the link column>)
 * (Postgres 15+): a plain SET NULL would also null user_id. So a product,
 * purchase, category or receipt deleted for good leaves the euro in the
 * ledger, unlinked (drizzle-kit writes the plain form: edit the SQL).
 */
import { sql } from "drizzle-orm";
import {
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
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { products, purchases } from "./pantry";

const tstz = (name: string) => timestamp(name, { withTimezone: true });
const idColumn = () =>
  uuid("id")
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey();
const ownerColumn = () =>
  uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

export const MONEY_KINDS = ["expense", "income"] as const;
export type MoneyKind = (typeof MONEY_KINDS)[number];
export const PAY_METHODS = ["card", "cash", "account", "other"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];

export const moneyCategories = pgTable(
  "money_categories",
  {
    id: idColumn(),
    userId: ownerColumn(),
    name: text("name").notNull(),
    kind: text("kind").$type<MoneyKind>().notNull(),
    /** Null = a top-level category; else its parent (one level only). */
    parentId: uuid("parent_id"),
    /**
     * A starter category's role, stable across renames: "groceries" and
     * "eating_out" are what food costs are compared with. Null = the user's own.
     */
    key: text("key"),
    /** An icon key known to the UI (features/money/MoneyIcon); "" = the parent's. */
    icon: text("icon").notNull().default(""),
    position: integer("position").notNull().default(0),
    createdAt: tstz("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    unique("money_categories_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "money_categories_parent_fk",
      columns: [t.parentId, t.userId],
      foreignColumns: [t.id, t.userId],
    }).onDelete("restrict"),
    uniqueIndex("money_categories_user_name_uq")
      .on(t.userId, t.kind, t.name)
      .where(sql`${t.deletedAt} is null`),
    check("money_categories_kind_ck", sql`${t.kind} in ('expense', 'income')`),
  ],
);

export const moneyReceipts = pgTable(
  "money_receipts",
  {
    id: idColumn(),
    userId: ownerColumn(),
    day: date("day", { mode: "string" }).notNull(),
    shop: text("shop").notNull().default(""),
    /** The receipt as text, as pasted or read: kept as the source. */
    text: text("text").notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    unique("money_receipts_id_user_uq").on(t.id, t.userId),
    index("money_receipts_user_day_idx").on(t.userId, t.day),
  ],
);

export const moneyMovements = pgTable(
  "money_movements",
  {
    id: idColumn(),
    userId: ownerColumn(),
    day: date("day", { mode: "string" }).notNull(),
    /** Signed integer cents: spending < 0, income > 0. */
    amountCents: integer("amount_cents").notNull(),
    categoryId: uuid("category_id"),
    description: text("description").notNull().default(""),
    shop: text("shop").notNull().default(""),
    method: text("method").$type<PayMethod>(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    receiptId: uuid("receipt_id"),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    unique("money_movements_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "money_movements_category_fk",
      columns: [t.categoryId, t.userId],
      foreignColumns: [moneyCategories.id, moneyCategories.userId],
    }).onDelete("set null"),
    foreignKey({
      name: "money_movements_receipt_fk",
      columns: [t.receiptId, t.userId],
      foreignColumns: [moneyReceipts.id, moneyReceipts.userId],
    }).onDelete("set null"),
    check("money_movements_amount_ck", sql`${t.amountCents} <> 0`),
    check(
      "money_movements_method_ck",
      sql`${t.method} in ('card', 'cash', 'account', 'other')`,
    ),
    index("money_movements_user_day_idx").on(t.userId, t.day),
  ],
);

export const moneyLines = pgTable(
  "money_lines",
  {
    id: idColumn(),
    userId: ownerColumn(),
    movementId: uuid("movement_id").notNull(),
    position: integer("position").notNull(),
    /** As on the receipt ("PASSATA MUTTI 700G"). */
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 8, scale: 2, mode: "string" }),
    /** What the line cost, discounts included, ≥ 0. */
    amountCents: integer("amount_cents").notNull(),
    productId: uuid("product_id"),
    /** The pantry purchase this line became, if any. */
    purchaseId: uuid("purchase_id"),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      name: "money_lines_movement_fk",
      columns: [t.movementId, t.userId],
      foreignColumns: [moneyMovements.id, moneyMovements.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "money_lines_product_fk",
      columns: [t.productId, t.userId],
      foreignColumns: [products.id, products.userId],
    }).onDelete("set null"),
    foreignKey({
      name: "money_lines_purchase_fk",
      columns: [t.purchaseId, t.userId],
      foreignColumns: [purchases.id, purchases.userId],
    }).onDelete("set null"),
    check("money_lines_amount_ck", sql`${t.amountCents} >= 0`),
    index("money_lines_movement_idx").on(t.movementId),
  ],
);

export const receiptAliases = pgTable(
  "receipt_aliases",
  {
    id: idColumn(),
    userId: ownerColumn(),
    /** The receipt text, normalised (core/money/receipts.ts aliasKey). */
    key: text("key").notNull(),
    productId: uuid("product_id").notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("receipt_aliases_user_key_uq").on(t.userId, t.key),
    foreignKey({
      name: "receipt_aliases_product_fk",
      columns: [t.productId, t.userId],
      foreignColumns: [products.id, products.userId],
    }).onDelete("cascade"),
  ],
);
