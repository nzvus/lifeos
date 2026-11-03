/**
 * core/food/cost.ts — what eating costs (dossiers/costs.md §5, ledger HOME-14):
 * always an estimate («≈»), never the money spent (Soldi) nor the value at
 * home (pantry). Pure.
 *
 * - A price is an observation (ADR-0055): a format's price per 100 g is its
 *   latest observation per shop up to the day; a product's and a food's is
 *   the median of their formats' prices.
 * - A logged line keeps its price in its snapshot (ADR-0007) as `cents`, the
 *   cents per 100 g or ml, so `lineTotals` sums it like a nutrient; a line
 *   converted from v1 has `packagePriceCents` + `packageSize` instead.
 * - Coverage is the share of kcal on priced lines; under 80 % a total names
 *   what has no price instead of showing a smaller number as the whole.
 */
import Big from "big.js";

/** The snapshot field: cents per 100 g (or ml) of the line, 2 decimals. */
export const PRICE_FIELD = "cents";
/** Under this share of kcal priced, a total says what is missing. */
export const COVERAGE_MIN = 0.8;

export type PriceObservation = {
  formatId: string;
  shop: string;
  day: string;
  cents: number;
  packageQty: string;
};

const median = (xs: readonly Big[]): Big | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a.cmp(b));
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : s[m - 1]!.plus(s[m]!).div(2);
};

/** Each format's price per 100: the median over shops of each shop's latest observation ≤ day. */
export function formatPrices(
  obs: readonly PriceObservation[],
  day: string,
): Map<string, Big> {
  const latest = new Map<string, PriceObservation>();
  for (const o of obs) {
    if (o.day > day || !(Number(o.packageQty) > 0)) continue;
    const k = o.formatId + "\u0000" + o.shop;
    const was = latest.get(k);
    if (!was || o.day > was.day) latest.set(k, o);
  }
  const per = new Map<string, Big[]>();
  for (const o of latest.values())
    per.set(o.formatId, [
      ...(per.get(o.formatId) ?? []),
      new Big(o.cents).times(100).div(o.packageQty),
    ]);
  return new Map([...per].map(([f, xs]) => [f, median(xs)!]));
}

/**
 * The price per 100 of each food and product, from its formats' prices:
 * `formats` maps a format to its product, `products` a product to its food.
 * Keys: the food's id, and "<food>:<product>" (FoodChoice.key).
 */
export function choicePrices(
  prices: ReadonlyMap<string, Big>,
  formats: ReadonlyMap<string, string>,
  products: ReadonlyMap<string, string>,
): Map<string, string> {
  const byProduct = new Map<string, Big[]>();
  const byFood = new Map<string, Big[]>();
  for (const [format, p] of prices) {
    const product = formats.get(format);
    const food = product ? products.get(product) : undefined;
    if (!product || !food) continue;
    byProduct.set(product, [...(byProduct.get(product) ?? []), p]);
    byFood.set(food, [...(byFood.get(food) ?? []), p]);
  }
  const out = new Map<string, string>();
  for (const [food, xs] of byFood) out.set(food, median(xs)!.toFixed(2));
  for (const [product, xs] of byProduct)
    out.set(products.get(product)! + ":" + product, median(xs)!.toFixed(2));
  return out;
}

export type CostLine = { name: string; quantity: string; values: Record<string, string> };

/** A line's cents per 100 from its snapshot (v2 `cents`, or v1's package price), else null. */
export function centsPer100(values: Record<string, string>): Big | null {
  const own = values[PRICE_FIELD];
  if (own !== undefined) return new Big(own);
  const pack = values["packagePriceCents"];
  const size = values["packageSize"];
  if (pack === undefined || size === undefined || !(Number(size) > 0)) return null;
  return new Big(pack).times(100).div(size);
}

export type Cost = {
  /** Cents of the priced lines, exact. */
  cents: Big;
  kcal: Big;
  pricedKcal: Big;
  /** The names of the lines with kcal and no price. */
  missing: string[];
};

export const NO_COST: Cost = {
  cents: new Big(0),
  kcal: new Big(0),
  pricedKcal: new Big(0),
  missing: [],
};

/** A composite entry's cost (lines × servings), or a price paid for it (eaten out). */
export function entryCost(
  lines: readonly CostLine[],
  servings: string | null = null,
  paidCents: number | null = null,
): Cost {
  const times = new Big(servings ?? "1");
  let cents = new Big(0);
  let kcal = new Big(0);
  let pricedKcal = new Big(0);
  const missing: string[] = [];
  for (const l of lines) {
    const qty = new Big(l.quantity).times(times);
    const k = new Big(l.values["kcal"] ?? "0").times(qty).div(100);
    kcal = kcal.plus(k);
    const c = centsPer100(l.values);
    if (c !== null) {
      cents = cents.plus(c.times(qty).div(100));
      pricedKcal = pricedKcal.plus(k);
    } else if (k.gt(0)) missing.push(l.name);
  }
  if (paidCents !== null)
    return { cents: new Big(paidCents), kcal, pricedKcal: kcal, missing: [] };
  return { cents, kcal, pricedKcal, missing };
}

/** The sum of several costs (a day, a week). */
export function sumCosts(costs: readonly Cost[]): Cost {
  return costs.reduce(
    (a, c) => ({
      cents: a.cents.plus(c.cents),
      kcal: a.kcal.plus(c.kcal),
      pricedKcal: a.pricedKcal.plus(c.pricedKcal),
      missing: [...a.missing, ...c.missing],
    }),
    NO_COST,
  );
}

/** The share of kcal on priced lines (1 when nothing has kcal). */
export const coverage = (c: Cost): number =>
  c.kcal.gt(0) ? Number(c.pricedKcal.div(c.kcal)) : 1;

const eur = (cents: Big, step: number) => {
  const v = Math.round(Number(cents) / step) * step;
  return (v / 100).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * In words: «≈ 6,60 €» (a total, to 10 cents; a line to the cent), or «≈ 4,80 € ·
 * 2 senza prezzo» under 80 % coverage; null when nothing is priced.
 */
export function costWords(c: Cost, line = false): string | null {
  if (c.pricedKcal.eq(0) && c.cents.eq(0)) return null;
  const head = "≈ " + eur(c.cents, line ? 1 : 10) + " €";
  if (coverage(c) >= COVERAGE_MIN) return head;
  const n = c.missing.length;
  return head + " · " + n + " senza prezzo";
}
