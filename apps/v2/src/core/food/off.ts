/**
 * core/food/off.ts — a product from Open Food Facts (the free, open
 * food database) turned into an ingredient form's values: name, unit,
 * nutrients per 100 g/ml, package size, NOVA. Pure: the app fetches
 * (https://world.openfoodfacts.org/api/v2/product/<code>.json) and passes
 * the JSON here. Missing nutrients stay empty — never guessed — and the
 * form shows them for the user to fill.
 */
import Big from "big.js";

export type OffPrefill = {
  barcode: string;
  name: string;
  description: string;
  unit: "g" | "ml";
  kcal: string;
  protein: string;
  carbs: string;
  sugars: string;
  fat: string;
  saturatedFat: string;
  fibre: string;
  salt: string;
  packageSize: string;
  nova: string;
};

/** Fields to ask for (smaller answers). */
export const OFF_FIELDS = [
  "product_name",
  "product_name_it",
  "brands",
  "quantity",
  "nova_group",
  "nutriments",
].join(",");

const NUTRIMENT: Record<string, string> = {
  kcal: "energy-kcal_100g",
  protein: "proteins_100g",
  carbs: "carbohydrates_100g",
  sugars: "sugars_100g",
  fat: "fat_100g",
  saturatedFat: "saturated-fat_100g",
  fibre: "fiber_100g",
  salt: "salt_100g",
};

/** A number (or numeric string) with at most `scale` decimals, or "". */
function decimal(v: unknown, scale = 3): string {
  const n =
    typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(",", ".")) : NaN;
  if (!Number.isFinite(n) || n < 0) return "";
  return new Big(n).round(scale, Big.roundHalfUp).toString();
}

/** "500 g", "1 kg", "1,5 l", "750ml", "6 x 125 g" → amount in g or ml, or null. */
export function parseQuantity(q: string): { amount: string; unit: "g" | "ml" } | null {
  const m = /(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|l|cl|ml)\b/i.exec(q);
  if (!m) return null;
  const count = m[1] ? Number(m[1]) : 1;
  const n = new Big(m[2]!.replace(",", ".")).times(count);
  const u = m[3]!.toLowerCase();
  const grams = u === "kg" ? n.times(1000) : u === "g" ? n : null;
  const ml = u === "l" ? n.times(1000) : u === "cl" ? n.times(10) : u === "ml" ? n : null;
  return grams
    ? { amount: grams.toString(), unit: "g" }
    : { amount: ml!.toString(), unit: "ml" };
}

export function offPrefill(barcode: string, json: unknown): OffPrefill | null {
  const body = json as { status?: number; product?: Record<string, unknown> };
  const p = body?.product;
  if (!p || body.status === 0) return null;
  const n = (p.nutriments ?? {}) as Record<string, unknown>;
  const qty = typeof p.quantity === "string" ? parseQuantity(p.quantity) : null;
  const nova =
    typeof p.nova_group === "number" && p.nova_group >= 1 && p.nova_group <= 4
      ? String(p.nova_group)
      : "";
  const name = String(p.product_name_it || p.product_name || "").trim();
  return {
    barcode,
    name: name || barcode,
    description: String(p.brands ?? "")
      .split(",")[0]!
      .trim(),
    unit: qty?.unit ?? "g",
    ...(Object.fromEntries(
      Object.entries(NUTRIMENT).map(([k, f]) => [k, decimal(n[f])]),
    ) as Record<keyof typeof NUTRIMENT, string>),
    packageSize: qty ? decimal(qty.amount, 2) : "",
    nova,
  } as OffPrefill;
}
