/**
 * core/food/choices.ts — the composer's choices (V-04), pure so the browser
 * can search them: each live food, and each of its products, with its
 * values per 100 g (or ml) resolved as ADR-0055 says: a product holds only
 * what its label says differently from its food, so its values are the
 * food's with its own on top. Each carries how often it was eaten in the
 * last 90 days and the quantity of the last time, for the ranking (find.md
 * §2) and the line's starting quantity. `catalog.ts` reads them.
 */
/** The values a meal line keeps: the nutrients parity compares, and NOVA. */
export const SNAPSHOT_FIELDS = [
  "kcal",
  "protein",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fibre",
  "salt",
  "nova",
] as const;

export type FoodChoice = {
  /** The food's id, or "<food>:<product>". */
  key: string;
  foodId: string;
  productId: string | null;
  name: string;
  /** The product's name (its brand), when the choice is a product. */
  brand: string | null;
  unit: string;
  per100: Record<string, string>;
  uses: number;
  lastQty: string | null;
};

export type ItemRow = {
  id: string;
  catalog: string;
  name: string;
  parentId: string | null;
};
export type ValueRow = {
  itemId: string;
  field: string;
  num: string | null;
  text: string | null;
};
export type UseRow = {
  itemId: string;
  productId: string | null;
  uses: number;
  lastQty: string | null;
};

export const USE_DAYS = 90;
const FIELDS = new Set<string>(SNAPSHOT_FIELDS);

/** Pure: the choices from the rows, foods first by name, each followed by its products. */
export function foodChoices(
  items: readonly ItemRow[],
  values: readonly ValueRow[],
  uses: readonly UseRow[],
): FoodChoice[] {
  const per = new Map<string, Record<string, string>>();
  const unit = new Map<string, string>();
  for (const v of values) {
    if (v.field === "unit" && v.text) unit.set(v.itemId, v.text);
    if (FIELDS.has(v.field) && v.num !== null)
      per.set(v.itemId, { ...per.get(v.itemId), [v.field]: v.num });
  }
  const used = new Map(uses.map((u) => [u.itemId + ":" + (u.productId ?? ""), u]));
  const foods = items
    .filter((i) => i.catalog === "food")
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
  const products = items.filter((i) => i.catalog === "product");
  const out: FoodChoice[] = [];
  for (const f of foods) {
    const base = per.get(f.id) ?? {};
    const u = used.get(f.id + ":");
    out.push({
      key: f.id,
      foodId: f.id,
      productId: null,
      name: f.name,
      brand: null,
      unit: unit.get(f.id) ?? "g",
      per100: base,
      uses: u?.uses ?? 0,
      lastQty: u?.lastQty ?? null,
    });
    for (const p of products.filter((p) => p.parentId === f.id)) {
      const pu = used.get(f.id + ":" + p.id);
      out.push({
        key: f.id + ":" + p.id,
        foodId: f.id,
        productId: p.id,
        name: f.name,
        brand: p.name,
        unit: unit.get(p.id) ?? unit.get(f.id) ?? "g",
        per100: { ...base, ...per.get(p.id) },
        uses: pu?.uses ?? 0,
        lastQty: pu?.lastQty ?? null,
      });
    }
  }
  return out;
}

/** "Caffè" and "caffe" are the same word to a search. */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Pure: the choices whose name and brand hold every word typed, most eaten
 * first; with nothing typed, the most eaten.
 */
export function searchFoods(
  choices: readonly FoodChoice[],
  query: string,
  limit = 8,
): FoodChoice[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return choices
    .filter((c) => {
      if (words.length === 0) return c.uses > 0;
      const hay = fold(c.name + " " + (c.brand ?? ""));
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name, "it"))
    .slice(0, limit);
}
