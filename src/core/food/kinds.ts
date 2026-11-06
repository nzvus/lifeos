/**
 * core/food/kinds.ts — each macro split into its kinds (kinds.md "What a
 * food carries"): protein by quality, carbs by kind of sugar or starch, fat
 * by fatty acid, fibre by type. The amounts are the lines' own (their
 * snapshot, ADR-0007); the catalog's estimates only give the shares within
 * each macro, so the kinds of a macro always add up to its total. A line
 * whose food has no estimate for a macro counts as "none" (senza stima).
 * For fibre, a food with no grams but v1's list of its fibre types
 * (`fibreTypes`, "insoluble,pectin") splits its fibre evenly among them: a
 * rougher estimate than grams, better than none.
 */
import Big from "big.js";

export type Macro = "protein" | "carbs" | "fat" | "fibre";

/** Each macro's kinds in kinds.md's fixed order; the catalog field is "<macro>_<kind>". */
export const KINDS: Record<Macro, readonly string[]> = {
  protein: ["high", "medium", "low"],
  carbs: ["whole", "refined", "intrinsic", "free"],
  fat: ["mufa", "pufa6", "n3", "sfa", "trans"],
  fibre: ["insoluble", "resistant", "betaglucan", "pectin", "inulin", "gos"],
};
export const MACROS = Object.keys(KINDS) as Macro[];
export const KIND_FIELDS: readonly string[] = MACROS.flatMap((m) =>
  KINDS[m].map((k) => m + "_" + k),
);
/** v1's categorical fibre types of a food, a text field ("insoluble,pectin"). */
export const FIBRE_TYPES = "fibreTypes";
/** v1's names → kinds.md's. Psyllium has no kind: alone it stays none, in a list the others share it. */
const V1_FIBRE: Record<string, string> = {
  insoluble: "insoluble",
  pectin: "pectin",
  gos: "gos",
  inulin_fos: "inulin",
  beta_glucan: "betaglucan",
  resistant_starch: "resistant",
};

export type KindLine = {
  quantity: string;
  /** The line's snapshot per 100. */
  values: Record<string, string>;
  /** The food's estimates per 100, by catalog field ("fat_mufa"); none when unknown. */
  estimates?: Record<string, string>;
};

/** Macro → kind → grams, "none" for what no estimate splits. */
export type MacroKinds = Record<Macro, Record<string, number>>;

export function macroKinds(
  lines: readonly KindLine[],
  servings: string | null = null,
): MacroKinds {
  const out = Object.fromEntries(MACROS.map((m) => [m, {}])) as MacroKinds;
  const times = new Big(servings ?? "1");
  for (const l of lines)
    for (const m of MACROS) {
      const per = l.values[m];
      if (per === undefined) continue;
      const grams = new Big(per).times(l.quantity).times(times).div(100);
      if (grams.lte(0)) continue;
      let est = KINDS[m].map(
        (k) => [k, Number(l.estimates?.[m + "_" + k] ?? 0)] as const,
      );
      const listed = (l.estimates?.[FIBRE_TYPES] ?? "")
        .split(",")
        .flatMap((t) => (V1_FIBRE[t.trim()] ? [V1_FIBRE[t.trim()]!] : []));
      if (m === "fibre" && est.every(([, v]) => v <= 0) && listed.length > 0)
        est = listed.map((k) => [k, 1] as const);
      const sum = est.reduce((a, [, v]) => a + Math.max(0, v), 0);
      const add = (k: string, g: number) => (out[m][k] = (out[m][k] ?? 0) + g);
      if (sum <= 0) add("none", grams.toNumber());
      else
        for (const [k, v] of est) if (v > 0) add(k, grams.times(v).div(sum).toNumber());
    }
  return out;
}
