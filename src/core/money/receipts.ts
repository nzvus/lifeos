/**
 * core/money/receipts.ts — a supermarket receipt's TEXT into lines
 * (ADR-0036). PURE.
 *
 *   parseReceipt   reads Italian receipts without a model: "DESCRIPTION
 *                  1,29", quantity rows ("2 x 1,29"), weights ("0,512 kg x
 *                  2,99"), discounts (a negative amount, or SCONTO…) that
 *                  lower the line above, the TOTAL, the date, the shop
 *   aliasKey       how a receipt description is remembered for a product
 *   receiptPrompt / parseModelReceipt
 *                  the optional model pass (the user's key, ADR-0018): the
 *                  same shape back, validated, never trusted blindly
 *
 * Amounts are integer cents. A line is never below zero.
 */
import { z } from "zod";
import type { Complete } from "../assistant/model";
import { Big, parseDecimalInput } from "../shared/decimal";
import { isValidDay } from "../shared/dates";

export type ReceiptLine = {
  description: string;
  /** Pieces or kg, as printed; null = one. */
  quantity: string | null;
  amountCents: number;
};
export type ParsedReceipt = {
  shop: string;
  day: string | null;
  lines: ReceiptLine[];
  /** The printed total, if found. */
  totalCents: number | null;
};

const AMOUNT = /(-?\d{1,5}[.,]\d{2})\s*(?:€|EUR)?\s*[A-Z*]{0,2}\s*$/i;
const QTY =
  /^\s*(\d+(?:[.,]\d{1,3})?)\s*(?:kg|pz|n\.?)?\s*[xX*]\s*(\d{1,5}[.,]\d{2,3})(?:\s*(?:€|EUR))?(?:\s*\/\s*kg)?\s*$/i;
const SKIP =
  /\b(sub\s*totale|totale|resto|contant[ei]|pagamento|bancomat|carta di credito|carta di debito|pagato|iva|imponibile|articoli|documento|commerciale|scontrino|cassiere|operatore|transazione|grazie|arrivederci|p\.?\s*iva|tel\.?|www\.|matricola|non riscosso)\b/i;
const DISCOUNT = /\b(sconto|sc\.|promo|offerta|buono|coupon|risparmio)\b/i;
const TOTAL = /\btotale(?:\s+complessivo|\s+euro)?\b/i;
const DATE = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/;

/** "-0,30" → -30; null when it is not an amount. */
const cents = (raw: string) => {
  const negative = raw.trim().startsWith("-");
  const v = parseDecimalInput(raw.replace("-", ""));
  if (v === null) return null;
  const c = new Big(v).times(100).round(0, Big.roundHalfUp).toNumber();
  return negative ? -c : c;
};

export function parseReceipt(text: string): ParsedReceipt {
  const rows = text
    .split(/\r?\n/)
    .map((r) => r.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const lines: ReceiptLine[] = [];
  let totalCents: number | null = null;
  let day: string | null = null;
  let pendingQty: string | null = null;

  for (const row of rows) {
    const date = row.match(DATE);
    if (date && !day) {
      const [, d, m, y] = date;
      const year = y!.length === 2 ? `20${y}` : y!;
      const iso = `${year}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
      if (isValidDay(iso)) day = iso;
    }
    const qty = row.match(QTY);
    if (qty) {
      pendingQty = parseDecimalInput(qty[1]!);
      continue;
    }
    const amount = row.match(AMOUNT);
    if (!amount) continue;
    const value = cents(amount[1]!);
    if (value === null) continue;
    // The VAT column ("4%", "22 %") is not part of the name.
    const description = row
      .slice(0, amount.index)
      .trim()
      .replace(/\s+\d{1,2}\s?%$/, "")
      .trim();
    if (TOTAL.test(row) && !/sub\s*totale/i.test(row)) {
      totalCents ??= Math.abs(value);
      continue;
    }
    // A discount lowers the line above (never below zero).
    if (value < 0 || DISCOUNT.test(description)) {
      const last = lines.at(-1);
      if (last) last.amountCents = Math.max(0, last.amountCents - Math.abs(value));
      continue;
    }
    if (SKIP.test(description) || !/[a-z]/i.test(description)) continue;
    lines.push({ description, quantity: pendingQty, amountCents: value });
    pendingQty = null;
  }
  const shop =
    rows.find(
      (r) => /[a-z]{3}/i.test(r) && !AMOUNT.test(r) && !SKIP.test(r) && !DATE.test(r),
    ) ?? "";
  return { shop: shop.slice(0, 80), day, lines, totalCents };
}

/** "Passata  MUTTI 700G" and "PASSATA MUTTI 700 G" → one key. */
export function aliasKey(description: string): string {
  return description
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .slice(0, 80);
}

/** The model pass: what to ask (the receipt and my product names). */
export function receiptPrompt(text: string, products: readonly string[]): string {
  return [
    "Read this Italian supermarket receipt. Answer ONLY with JSON, no prose:",
    '{"shop": string, "day": "YYYY-MM-DD" | null, "totalCents": number | null,',
    ' "lines": [{"description": string, "quantity": string | null, "amountCents": number, "product": string | null}]}',
    "- one line per item bought; a discount lowers its item; skip totals, payments, VAT;",
    "- amountCents = what the line cost after discounts, in cents (1,29 € = 129);",
    "- description: readable Italian, e.g. 'Passata Mutti 700 g';",
    "- product: the EXACT name from this list when it is clearly that item, else null:",
    JSON.stringify(products.slice(0, 300)),
    "Receipt:",
    text.slice(0, 6000),
  ].join("\n");
}

const modelReceipt = z.object({
  shop: z.string().max(80).catch(""),
  day: z
    .string()
    .nullable()
    .catch(null)
    .transform((d) => (d && isValidDay(d) ? d : null)),
  totalCents: z.number().int().min(0).max(10_000_000).nullable().catch(null),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(120),
        quantity: z
          .union([z.string(), z.number()])
          .nullable()
          .catch(null)
          .transform((q) => (q === null ? null : parseDecimalInput(String(q)))),
        amountCents: z.number().int().min(0).max(10_000_000),
        product: z.string().max(120).nullable().catch(null),
      }),
    )
    .max(200),
});
export type ModelReceipt = z.output<typeof modelReceipt>;

/** The model's answer, validated (JSON may come inside ``` fences). */
export function parseModelReceipt(content: string | null): ModelReceipt | null {
  if (!content) return null;
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const r = modelReceipt.safeParse(JSON.parse(content.slice(start, end + 1)));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

/** One model call, no tools: the receipt read as JSON, validated; null if unusable. */
export async function readWithModel(
  complete: Complete,
  model: string,
  text: string,
  products: readonly string[],
): Promise<ModelReceipt | null> {
  const answer = await complete({
    model,
    messages: [{ role: "user", content: receiptPrompt(text, products) }],
    tools: [],
  });
  return parseModelReceipt(answer.content);
}
