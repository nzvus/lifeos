/**
 * core/money/validation.ts — what the Money forms may send (ADR-0036): a
 * movement typed by hand. Euros typed by a person ("12,50") become exact
 * integer cents, signed by the kind (spending < 0). Tags are free words,
 * lower case, without "#", at most 10.
 */
import { z } from "zod";
import { MONEY_KINDS, PAY_METHODS } from "../db/schema/money";
import { Big } from "../shared/decimal";
import { day, decimalString, id, jsonField } from "../shared/validation";

const text = (max: number) => z.string().trim().max(max, "too_long");

/** "#Viaggio, rimborsabile  ufficio" → ["viaggio", "rimborsabile", "ufficio"]. */
export function parseTags(raw: string): string[] {
  const out: string[] = [];
  for (const w of raw.split(/[,\s]+/)) {
    const tag = w.replace(/^#+/, "").trim().toLowerCase().slice(0, 30);
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out.slice(0, 10);
}

export const movementInput = z
  .object({
    day,
    kind: z.enum(MONEY_KINDS, "invalid_choice"),
    amount: decimalString({ scale: 2, max: "999999", positive: true }),
    categoryId: z
      .string()
      .optional()
      .transform((v) => (v ? v : null))
      .pipe(id.nullable()),
    description: text(200).default(""),
    shop: text(80).default(""),
    method: z
      .string()
      .optional()
      .transform((v) => (v ? v : null))
      .pipe(z.enum(PAY_METHODS, "invalid_choice").nullable()),
    tags: z
      .string()
      .optional()
      .transform((v) => parseTags(v ?? "")),
  })
  .transform(({ amount, kind, ...rest }) => {
    const cents = new Big(amount).times(100).toNumber();
    return { ...rest, amountCents: kind === "expense" ? -cents : cents };
  });
export type MovementInput = z.output<typeof movementInput>;

/** A reviewed receipt (core/money/repositories/receipts.ts saveReceipt). */
const optionalId = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(id.nullable());

export const receiptInput = z.object({
  day,
  shop: z.string().trim().max(80, "too_long").default(""),
  text: z.string().trim().min(1, "required").max(20000, "too_long"),
  categoryId: optionalId,
  method: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.enum(PAY_METHODS, "invalid_choice").nullable()),
  lines: jsonField(
    z
      .array(
        z.object({
          description: z.string().trim().min(1, "required").max(120, "too_long"),
          quantity: z
            .string()
            .nullable()
            .transform((q) => (q && q.trim() ? q : null))
            .pipe(decimalString({ scale: 3, max: "999999" }).nullable()),
          amountCents: z.number().int().min(0).max(10_000_000),
          productId: z.string().nullable().pipe(id.nullable()),
          toPantry: z.boolean(),
        }),
      )
      .min(1, "required")
      .max(200),
  ),
});
export type ReceiptInput = z.output<typeof receiptInput>;
