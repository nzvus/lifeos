/**
 * core/catalog/family.ts — the family model of every catalog object
 * (ADR-0060, dossiers/objects.md §4–§5). An item's `parentId` is a *level*
 * when the parent is in the catalog above (food › product › format) and a
 * *variant* when the parent is in the same catalog: a variant keeps only
 * its differences and reads the rest from its base, at any depth, never in
 * a loop. `basedOnId` is provenance only («Parti da…»). Pure.
 */

export type FamilyItem = { id: string; catalog: string; parentId: string | null };

/** How deep variants may go (ADR-0060 tripwire: past three, rethink). */
export const MAX_VARIANT_DEPTH = 3;

/**
 * The bases of a variant, nearest first ([] for an item that is not one):
 * parents of the same catalog, stopping at a loop or past the depth.
 */
export function basesOf(id: string, items: ReadonlyMap<string, FamilyItem>): string[] {
  const out: string[] = [];
  const seen = new Set([id]);
  let at = items.get(id);
  while (at?.parentId && out.length < MAX_VARIANT_DEPTH) {
    const up = items.get(at.parentId);
    if (!up || up.catalog !== at.catalog || seen.has(up.id)) break;
    out.push(up.id);
    seen.add(up.id);
    at = up;
  }
  return out;
}

/** Whether `child` may become a variant of `base`: same catalog, no loop, not too deep. */
export function canBeVariant(
  child: FamilyItem,
  base: FamilyItem,
  items: ReadonlyMap<string, FamilyItem>,
): boolean {
  if (child.id === base.id || child.catalog !== base.catalog) return false;
  const above = basesOf(base.id, items);
  return !above.includes(child.id) && above.length + 1 <= MAX_VARIANT_DEPTH;
}

/** A recipe's part as stored: a food, its quantity and unit, the defaults (preferred product, removed). */
export type Part = {
  partItemId: string;
  quantity: string | null;
  unit: string | null;
  defaults: Record<string, unknown>;
};

/**
 * A variant's parts: its base's, then its own rows — a food already in the
 * base takes the variant's quantity and product, a new one is added after,
 * a row marked `removed` takes the food out.
 */
export function variantParts(base: readonly Part[], own: readonly Part[]): Part[] {
  const out = base.map((p) => ({ ...p }));
  for (const o of own) {
    const at = out.findIndex((p) => p.partItemId === o.partItemId);
    if (o.defaults["removed"] === true) {
      if (at >= 0) out.splice(at, 1);
    } else if (at >= 0) out[at] = { ...o };
    else out.push({ ...o });
  }
  return out;
}

/** A recipe's parts with its bases applied, from the farthest base down to it. */
export function resolveParts(
  id: string,
  items: ReadonlyMap<string, FamilyItem>,
  partsOf: (id: string) => readonly Part[],
): Part[] {
  const chain = [...basesOf(id, items)].reverse(); // the farthest base first
  if (chain.length === 0) return partsOf(id).map((p) => ({ ...p }));
  let parts = partsOf(chain[0]!).map((p) => ({ ...p }));
  for (const b of chain.slice(1)) parts = variantParts(parts, partsOf(b));
  return variantParts(parts, partsOf(id));
}

/**
 * What a variant must store so that `variantParts(base, stored)` gives
 * `wanted`: the foods added or changed (quantity, unit or product), and a
 * `removed` row for each base food left out. Equal to the base → [].
 */
export function partsDiff(base: readonly Part[], wanted: readonly Part[]): Part[] {
  const product = (p: Part) => p.defaults["preferredProduct"] ?? null;
  const same = (a: Part, b: Part) =>
    Number(a.quantity) === Number(b.quantity) &&
    (a.unit ?? "g") === (b.unit ?? "g") &&
    product(a) === product(b);
  const out: Part[] = [];
  for (const w of wanted) {
    const b = base.find((x) => x.partItemId === w.partItemId);
    if (!b || !same(b, w)) out.push({ ...w });
  }
  for (const b of base)
    if (!wanted.some((w) => w.partItemId === b.partItemId))
      out.push({
        partItemId: b.partItemId,
        quantity: null,
        unit: null,
        defaults: { removed: true },
      });
  return out;
}
