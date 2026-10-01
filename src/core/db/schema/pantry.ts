/**
 * core/db/schema/pantry.ts — what is at home (ADR-0013, extended by
 * ADR-0017): products bought (food or not), purchases, stock counts and
 * reminders. Stock itself is never stored: it is derived from purchases,
 * eaten log entries, cooked batches and counts (core, later), so it can
 * always be rebuilt and never disagrees with the log.
 *
 *   products ──< purchases
 *      │
 *      └─ optional link to an ingredient (food: stock per ingredient;
 *         anything else: stock per product, in g, ml or pieces)
 *   stock_counts: "I have this much now", per ingredient OR per product
 *   reminders: set by hand (derived ones are computed, not stored)
 *
 * Batches (cooking N portions) live in nutrition.ts, next to the log that
 * takes portions from them.
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
import { ingredients } from "./nutrition";

const tstz = (name: string) => timestamp(name, { withTimezone: true });
const idColumn = () =>
  uuid("id")
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey();
const ownerColumn = () =>
  uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

/** How a product is counted. "piece" for things that are not weighed. */
export const PRODUCT_UNITS = ["g", "ml", "piece"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

/**
 * Something you buy, as on the shelf: "Passata Mutti 700 g", "Detersivo
 * piatti 1 l", "Carta igienica ×8". `package_size` is in `unit` (for pieces,
 * how many in one package). Food links to its ingredient (nutrition stays on
 * the ingredient; several products may share one).
 */
export const products = pgTable(
  "products",
  {
    id: idColumn(),
    userId: ownerColumn(),
    name: text("name").notNull(),
    brand: text("brand").notNull().default(""),
    unit: text("unit").$type<ProductUnit>().notNull(),
    packageSize: numeric("package_size", {
      precision: 10,
      scale: 2,
      mode: "string",
    }).notNull(),
    ingredientId: uuid("ingredient_id"),
    shop: text("shop").notNull().default(""),
    barcode: text("barcode"),
    notes: text("notes").notNull().default(""),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // ADR-0015: in the trash since then (null = live); purged after 30 days.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    unique("products_id_user_uq").on(t.id, t.userId),
    uniqueIndex("products_user_name_uq")
      .on(t.userId, t.name)
      .where(sql`${t.deletedAt} is null`),
    // Composite: my product can only point to my ingredient. Restrict: an
    // ingredient a product still points to is not deleted for good.
    foreignKey({
      name: "products_ingredient_fk",
      columns: [t.ingredientId, t.userId],
      foreignColumns: [ingredients.id, ingredients.userId],
    }).onDelete("restrict"),
    check("products_unit_ck", sql`${t.unit} in ('g', 'ml', 'piece')`),
    check("products_package_size_ck", sql`${t.packageSize} > 0`),
    // Pieces are not weighed: a counted product can't feed an ingredient's grams.
    check(
      "products_piece_no_ingredient_ck",
      sql`${t.unit} <> 'piece' or ${t.ingredientId} is null`,
    ),
  ],
);

/** One purchase: N packages of a product on a day, at a price (if known). */
export const purchases = pgTable(
  "purchases",
  {
    id: idColumn(),
    userId: uuid("user_id").notNull(),
    productId: uuid("product_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    packages: numeric("packages", { precision: 8, scale: 2, mode: "string" }).notNull(),
    // What was paid for all the packages, in cents; null = not known.
    priceCents: integer("price_cents"),
    shop: text("shop").notNull().default(""),
    createdAt: tstz("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    unique("purchases_id_user_uq").on(t.id, t.userId),
    foreignKey({
      name: "purchases_product_fk",
      columns: [t.productId, t.userId],
      foreignColumns: [products.id, products.userId],
    }).onDelete("cascade"), // a product deleted for good takes its history
    check("purchases_packages_ck", sql`${t.packages} > 0`),
    check("purchases_price_ck", sql`${t.priceCents} >= 0`),
    index("purchases_user_day_idx").on(t.userId, t.day),
  ],
);

/**
 * "I have this much now": resets the derived stock of ONE ingredient (food,
 * in g/ml) or ONE product (anything else) at a moment, so drift from
 * untracked use is fixed by a single action (ADR-0013).
 */
export const stockCounts = pgTable(
  "stock_counts",
  {
    id: idColumn(),
    userId: uuid("user_id").notNull(),
    at: tstz("at").notNull(),
    ingredientId: uuid("ingredient_id"),
    productId: uuid("product_id"),
    quantity: numeric("quantity", { precision: 10, scale: 2, mode: "string" }).notNull(),
    createdAt: tstz("created_at").defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      name: "stock_counts_ingredient_fk",
      columns: [t.ingredientId, t.userId],
      foreignColumns: [ingredients.id, ingredients.userId],
    }).onDelete("cascade"),
    foreignKey({
      name: "stock_counts_product_fk",
      columns: [t.productId, t.userId],
      foreignColumns: [products.id, products.userId],
    }).onDelete("cascade"),
    check(
      "stock_counts_one_target_ck",
      sql`(${t.ingredientId} is null) <> (${t.productId} is null)`,
    ),
    check("stock_counts_quantity_ck", sql`${t.quantity} >= 0`),
    index("stock_counts_user_at_idx").on(t.userId, t.at),
  ],
);

/**
 * A reminder set by hand ("clean the fridge", every 7 days). Derived ones —
 * "runs out in 3 days", "2 portions left" — are computed, never stored.
 */
export const reminders = pgTable(
  "reminders",
  {
    id: idColumn(),
    userId: ownerColumn(),
    text: text("text").notNull(),
    dueDay: date("due_day", { mode: "string" }),
    // Repeats every N days after it is done; null = once.
    repeatDays: integer("repeat_days"),
    doneAt: tstz("done_at"),
    createdAt: tstz("created_at").defaultNow().notNull(),
    updatedAt: tstz("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    check("reminders_repeat_ck", sql`${t.repeatDays} > 0`),
    index("reminders_user_due_idx").on(t.userId, t.dueDay),
  ],
);
