/**
 * core/food/brands.ts — a food with no brand chosen reads the mean of its
 * brands, weighted by how the person eats them (ADR-0060, dossiers/objects.md
 * §5; his pick 3 Nov: «ok alle raccomandazioni»). Composition databases build
 * a generic food the same way, with shares (EuroFIR, NEVO, USDA ERS); the
 * share that matters here is his own use over 90 days, a never-eaten brand
 * counting once. Each field is averaged over the brands that have it; the
 * spread (min–max) goes with it, and a field is «uncertain» when the spread
 * is past the EU label tolerance (2012 guidance: ±2 g under 10 g, ±20 %
 * from 10 to 40 g, ±8 g over 40 g per 100 g; kcal ±20 %). Pure.
 */
import Big from "big.js";

export type Brand = { per100: Readonly<Record<string, string>>; uses: number };
export type BrandMean = {
  per100: Record<string, string>;
  spread: Record<string, [number, number]>;
  /** Fields whose brands differ more than a label may (the pill suggests choosing). */
  uncertain: string[];
  brands: number;
};

const GRAMS = new Set(["protein", "carbs", "sugars", "fat", "saturatedFat", "fibre"]);

/** Whether two values of a field differ past what a label tolerates. */
export function pastTolerance(field: string, lo: number, hi: number): boolean {
  const mid = (lo + hi) / 2;
  if (field === "kcal") return hi - lo > 0.4 * mid;
  if (!GRAMS.has(field)) return false;
  const tol = mid < 10 ? 2 : mid <= 40 ? 0.2 * mid : 8;
  return hi - lo > 2 * tol;
}

export function brandMean(brands: readonly Brand[]): BrandMean | null {
  if (brands.length === 0) return null;
  const fields = new Set(brands.flatMap((b) => Object.keys(b.per100)));
  const per100: Record<string, string> = {};
  const spread: Record<string, [number, number]> = {};
  const uncertain: string[] = [];
  for (const f of fields) {
    const have = brands.filter((b) => b.per100[f] !== undefined);
    const w = (b: Brand) => new Big(Math.max(1, b.uses));
    const total = have.reduce((a, b) => a.plus(w(b)), new Big(0));
    const sum = have.reduce(
      (a, b) => a.plus(new Big(b.per100[f]!).times(w(b))),
      new Big(0),
    );
    const xs = have.map((b) => Number(b.per100[f]));
    // All alike (or one brand): its value as written, not a recomputed one.
    per100[f] = xs.every((x) => x === xs[0])
      ? have[0]!.per100[f]!
      : sum.div(total).round(3, Big.roundHalfUp).toString();
    const lo = Math.min(...xs);
    const hi = Math.max(...xs);
    if (have.length > 1 && hi > lo) {
      spread[f] = [lo, hi];
      if (pastTolerance(f, lo, hi)) uncertain.push(f);
    }
  }
  return { per100, spread, uncertain, brands: brands.length };
}
