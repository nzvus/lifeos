/**
 * core/db/schema/supplements.ts — active compounds of an ingredient
 * (ADR-0039): caffeine in mg and creatine in g, per 100 g/ml like its
 * nutrients. A drink or a supplement is simply an ingredient that has them
 * (ADR-0038: supplements are food). One row per ingredient and compound.
 *
 * Read through the ingredient a log line points to (not snapshotted with
 * the line, ADR-0039): a can of Red Bull does not change its caffeine.
 */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  numeric,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { ingredients } from "./nutrition";

export const COMPOUNDS = ["caffeine", "creatine"] as const;
export type Compound = (typeof COMPOUNDS)[number];

export const ingredientCompounds = pgTable(
  "ingredient_compounds",
  {
    ingredientId: uuid("ingredient_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    compound: text("compound").$type<Compound>().notNull(),
    /** Per 100 g/ml: mg of caffeine, g of creatine. */
    amount: numeric("amount", { precision: 10, scale: 3, mode: "string" }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.ingredientId, t.compound] }),
    foreignKey({
      name: "ingredient_compounds_ingredient_fk",
      columns: [t.ingredientId, t.userId],
      foreignColumns: [ingredients.id, ingredients.userId],
    }).onDelete("cascade"),
    check(
      "ingredient_compounds_compound_ck",
      sql`${t.compound} in ('caffeine', 'creatine')`,
    ),
    check("ingredient_compounds_amount_ck", sql`${t.amount} > 0`),
  ],
);
