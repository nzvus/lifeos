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

/** How deep parent lines expand (ADR-0065, the same bound as variants). */
export const MAX_KIN_DEPTH = 3;

const productOf = (p: Part) => {
  const x = p.defaults["preferredProduct"];
  return typeof x === "string" ? x : null;
};
/** A food line's identity: the food, its unit and its preferred product. */
export const lineKey = (p: Part) =>
  p.partItemId + "|" + (p.unit ?? "g") + "|" + (productOf(p) ?? "");

/**
 * A pasto's foods with its parent lines expanded (MOD-23, ADR-0065): a line whose item is another
 * pasto counts as that pasto's foods × the line's quantity, at any depth up to three; a line in a
 * loop or deeper is left out. Equal foods (same unit and product) are summed, in first-seen order.
 * `partsOf` gives a pasto's own parts, null for an item that is not a pasto. Pure.
 */
export function expandParts(
  id: string,
  partsOf: (id: string) => readonly Part[] | null,
): Part[] {
  const out = new Map<string, Part>();
  const walk = (at: string, k: number, seen: ReadonlySet<string>) => {
    for (const p of partsOf(at) ?? []) {
      const q = Number(p.quantity ?? 1) * k;
      if (partsOf(p.partItemId) !== null) {
        if (!seen.has(p.partItemId) && seen.size < MAX_KIN_DEPTH + 1)
          walk(p.partItemId, q, new Set([...seen, p.partItemId]));
        continue;
      }
      const key = lineKey(p);
      const had = out.get(key);
      // The stored text stays when nothing was multiplied or summed.
      const quantity =
        p.quantity === null || (k === 1 && !had)
          ? p.quantity
          : String(+(q + Number(had?.quantity ?? 0)).toFixed(3));
      out.set(key, { ...p, quantity });
    }
  };
  walk(id, 1, new Set([id]));
  return [...out.values()];
}

export type Kin = { id: string; k: number; stored: boolean };

/**
 * Each pasto's parents (MOD-23): the ones stored as its lines, and the ones found — P is a parent
 * of C when every food of P (at least two) is in C's expanded foods, same unit and product, at
 * P's quantity × one common k (within 2 %). Two pasti with the same foods are kin only when k ≠ 1
 * (the smaller is the parent); equal ones are twins, not kin. Of the found ones only the largest
 * are kept and never two sharing a food, so a parent of a parent is not a parent too. Pure.
 */
export function kinship(
  pasti: readonly { id: string; own: readonly Part[]; foods: readonly Part[] }[],
): Map<string, Kin[]> {
  const ids = new Set(pasti.map((x) => x.id));
  const ratio = (parent: readonly Part[], child: readonly Part[]): number | null => {
    if (parent.length < 2) return null;
    let k: number | null = null;
    for (const p of parent) {
      const c = child.find((x) => lineKey(x) === lineKey(p));
      if (!c || !Number(p.quantity) || !Number(c.quantity)) return null;
      const r = Number(c.quantity) / Number(p.quantity);
      if (k === null) k = r;
      else if (Math.abs(r - k) / k > 0.02) return null;
    }
    return k;
  };
  const out = new Map<string, Kin[]>();
  for (const c of pasti) {
    const stored: Kin[] = c.own
      .filter((p) => ids.has(p.partItemId))
      .map((p) => ({ id: p.partItemId, k: Number(p.quantity ?? 1), stored: true }));
    const found: { id: string; k: number; foods: readonly Part[] }[] = [];
    for (const p of pasti) {
      if (p.id === c.id || stored.some((s) => s.id === p.id)) continue;
      const k = ratio(p.foods, c.foods);
      if (k === null) continue;
      if (p.foods.length === c.foods.length && k < 1.02) continue; // twins, or c is the smaller
      found.push({ id: p.id, k: +k.toFixed(2), foods: p.foods });
    }
    found.sort((a, b) => b.foods.length - a.foods.length);
    const taken = new Set(
      stored.flatMap((s) => pasti.find((x) => x.id === s.id)?.foods.map(lineKey) ?? []),
    );
    const kept: Kin[] = [];
    for (const f of found) {
      if (f.foods.some((x) => taken.has(lineKey(x)))) continue;
      f.foods.forEach((x) => taken.add(lineKey(x)));
      kept.push({ id: f.id, k: f.k, stored: false });
    }
    if (stored.length + kept.length > 0) out.set(c.id, [...stored, ...kept]);
  }
  return out;
}

/** The children of each pasto: the inverse of `kinship`. */
export function childrenOf(kin: ReadonlyMap<string, Kin[]>): Map<string, Kin[]> {
  const out = new Map<string, Kin[]>();
  for (const [child, parents] of kin)
    for (const p of parents)
      out.set(p.id, [...(out.get(p.id) ?? []), { id: child, k: p.k, stored: p.stored }]);
  return out;
}

/**
 * The longest name a catalog object may be given (his §157, «yc» §158: «un cap al nome di
 * ingredienti e pasti»): 40 characters. A name already longer stays while it is left as it is.
 */
export const NAME_MAX = 40;
export const nameTooLong = (name: string, current?: string | null) =>
  name.length > NAME_MAX && name !== current;
