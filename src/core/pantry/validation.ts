/**
 * core/pantry/validation.ts — what the pantry forms may send (ADR-0017):
 * a product, a purchase, a stock count, a hand-made reminder. Decimals keep
 * the column's scale (no silent rounding); errors are our codes.
 */
import { z } from "zod";
import { PRODUCT_UNITS } from "../db/schema/pantry";
import { Big } from "../shared/decimal";
import { day, decimalString, id } from "../shared/validation";

const text = (max: number) => z.string().trim().max(max, "too_long");

export const productInput = z
  .object({
    name: text(120).min(1, "required"),
    brand: text(80).default(""),
    unit: z.enum(PRODUCT_UNITS, "invalid_choice"),
    packageSize: decimalString({ scale: 2, max: "99999999", positive: true }),
    // Empty = not food (or not linked yet).
    ingredientId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null))
      .pipe(id.nullable()),
    shop: text(80).default(""),
    notes: text(500).default(""),
  })
  // Pieces aren't weighed: they can't feed an ingredient's grams (the DB
  // refuses it too — products_piece_no_ingredient_ck).
  .refine((p) => p.unit !== "piece" || p.ingredientId === null, {
    path: ["ingredientId"],
    message: "invalid_choice",
  });
export type ProductInput = z.infer<typeof productInput>;

export const purchaseInput = z
  .object({
    productId: id,
    day,
    packages: decimalString({ scale: 2, max: "999999", positive: true }),
    // Euros typed by a person ("2,09"); stored in cents. Empty = not known.
    price: z
      .string()
      .optional()
      .transform((v) => (v ?? "").trim())
      .pipe(
        z.union([
          z.literal("").transform(() => null),
          // Exact: "2.09" → 209 (never through a float).
          decimalString({ scale: 2, max: "99999" }).transform((v) =>
            new Big(v).times(100).toNumber(),
          ),
        ]),
      ),
    shop: text(80).default(""),
  })
  // The form field is "price" (euros); the column is price_cents.
  .transform(({ price, ...rest }) => ({ ...rest, priceCents: price }));
export type PurchaseInput = z.infer<typeof purchaseInput>;

/** "I have this much now" — of an ingredient (g/ml) or a product (its unit). */
export const countInput = z
  .object({
    ingredientId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null))
      .pipe(id.nullable()),
    productId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null))
      .pipe(id.nullable()),
    quantity: decimalString({ scale: 2, max: "99999999" }),
  })
  .refine((c) => (c.ingredientId === null) !== (c.productId === null), {
    path: ["_form"],
    message: "invalid_choice",
  });
export type CountInput = z.infer<typeof countInput>;

export const reminderInput = z.object({
  text: text(200).min(1, "required"),
  dueDay: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(day.nullable()),
  // Every N days after it is done; empty = once.
  repeatDays: z
    .string()
    .optional()
    .transform((v, ctx) => {
      const raw = (v ?? "").trim();
      if (raw === "") return null;
      const n = Number(raw);
      if (!Number.isInteger(n)) {
        ctx.addIssue({ code: "custom", message: "invalid_number" });
        return z.NEVER;
      }
      if (n < 1 || n > 366) {
        ctx.addIssue({ code: "custom", message: n < 1 ? "not_positive" : "too_large" });
        return z.NEVER;
      }
      return n;
    }),
});
export type ReminderInput = z.infer<typeof reminderInput>;
