"use client";
/**
 * The composer's family picks (ADR-0060, dossiers/objects.md §6): on a
 * food's line, which brand — «media delle marche» (the mean weighted by his
 * use) or one brand; in the search, a food with brands shows once, its
 * brands only when the words name one; saved meals show their variants
 * right under their base.
 */
import { F } from "@lifeos/kit";
import { fold, type FoodChoice, type RecipeChoice } from "@/core/food/choices";
import { mealTotals } from "./composer";

/** The brand choice under a line: the mean, or one of the food's brands. */
export function BrandSelect({
  current,
  choices,
  onPick,
}: {
  current: FoodChoice | undefined;
  choices: readonly FoodChoice[];
  onPick: (key: string) => void;
}) {
  if (!current?.foodId) return null;
  const family = choices.filter((c) => c.foodId === current.foodId);
  const brands = family.filter((c) => c.productId !== null);
  if (brands.length === 0) return null;
  const generic = family.find((c) => c.productId === null);
  return (
    <label className="k-line g2 k-brandpick">
      <span className="k-meta">Marca</span>
      <select
        className="k-select"
        value={current.key}
        onChange={(e) => onPick(e.target.value)}
        aria-label={"Marca di " + current.name}
      >
        {generic && (
          <option value={generic.key}>
            {brands.length > 1 ? "media delle " + brands.length + " marche" : "qualsiasi"}
          </option>
        )}
        {[...brands]
          .sort((a, b) => b.uses - a.uses)
          .map((b) => (
            <option key={b.key} value={b.key}>
              {b.brand}
            </option>
          ))}
      </select>
    </label>
  );
}

/**
 * A food with brands shows once (its mean); a brand shows on its own only when
 * the words typed name it («passata mutti»).
 */
export function collapseBrands(
  found: readonly FoodChoice[],
  query: string,
): FoodChoice[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const named = (c: FoodChoice) =>
    !!c.brand && words.some((w) => fold(c.brand!).includes(w));
  const shown = new Set(found.filter((c) => c.productId === null).map((c) => c.foodId));
  return found.filter((c) => c.productId === null || named(c) || !shown.has(c.foodId));
}

/** Saved meals with each base's variants right after it, and how many it has. */
export function withVariants(
  found: readonly RecipeChoice[],
): { r: RecipeChoice; variants: number; under: string | null }[] {
  const byId = new Map(found.map((r) => [r.recipeId, r]));
  const out: { r: RecipeChoice; variants: number; under: string | null }[] = [];
  const placed = new Set<string>();
  const kids = (id: string) => found.filter((x) => x.baseId === id);
  for (const r of found) {
    if (placed.has(r.recipeId) || (r.baseId && byId.has(r.baseId))) continue;
    out.push({ r, variants: kids(r.recipeId).length, under: null });
    placed.add(r.recipeId);
    for (const k of kids(r.recipeId)) {
      out.push({ r: k, variants: 0, under: r.name });
      placed.add(k.recipeId);
    }
  }
  for (const r of found)
    if (!placed.has(r.recipeId)) out.push({ r, variants: 0, under: null });
  return out;
}

/** A saved meal as a search row says: its family, then its foods and kcal (or «stima»). */
export function recipeMeta(
  r: RecipeChoice,
  variants: number,
  under: string | null,
  by: ReadonlyMap<string, FoodChoice>,
): string {
  return (
    (under
      ? "variante di " + under + " · "
      : variants > 0
        ? F.plural(variants, "variante", "varianti") + " · "
        : "") +
    (r.estimate
      ? "stima · " + F.num(Number(r.estimate["kcal"] ?? 0), "kcal")
      : F.plural(r.parts.length, "cibo", "cibi") +
        " · " +
        F.num(
          mealTotals(
            r.parts.map((p) => ({ key: p.key, quantity: p.quantity })),
            by,
          )["kcal"] ?? 0,
          "kcal",
        ))
  );
}
