/**
 * core/food/kin.ts — kinship between pasti written (MOD-23, ADR-0065): a parent is one of the
 * child's lines, the parent pasto × k. Its multiplier stepped, a parent added (its foods then count
 * in the child, by the expansion), a child made (a copy named by the copy rule, holding this pasto
 * × 1). Never a loop: a pasto cannot hold itself, at any depth. Only live pasti of the owner.
 */
import { and, eq, isNull, max } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, catalogParts } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { expandParts, kinship, lineKey, MAX_KIN_DEPTH } from "../catalog/family";
import { readRecipeFamily, recipeNameTaken, rewriteParts } from "./recipes";

const NAME_MAX = 80;

async function livePasti(db: Db, owner: Owner): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: catalogItems.id, name: catalogItems.name })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "recipe"),
        isNull(catalogItems.deletedAt),
      ),
    );
  return new Map(rows.map((r) => [r.id, r.name]));
}

/** The pasti a pasto holds as lines, at any depth (loop-safe). */
async function heldBy(db: Db, owner: Owner, id: string, pasti: Map<string, string>) {
  const parts = await db
    .select({ itemId: catalogParts.itemId, partItemId: catalogParts.partItemId })
    .from(catalogParts)
    .where(ownedBy(catalogParts, owner));
  const out = new Set<string>();
  const walk = (at: string, depth: number) => {
    if (depth > MAX_KIN_DEPTH) return;
    for (const p of parts)
      if (p.itemId === at && pasti.has(p.partItemId) && !out.has(p.partItemId)) {
        out.add(p.partItemId);
        walk(p.partItemId, depth + 1);
      }
  };
  walk(id, 0);
  return out;
}

/** «× k» stepped on a stored parent: false when the line is not there or k is not > 0. */
export async function setParentK(
  db: Db,
  owner: Owner,
  childId: string,
  parentId: string,
  k: number,
): Promise<boolean> {
  if (!(k > 0) || k > 99) return false;
  const rows = await db
    .update(catalogParts)
    .set({ quantity: String(k) })
    .where(
      and(
        ownedBy(catalogParts, owner),
        eq(catalogParts.itemId, childId),
        eq(catalogParts.partItemId, parentId),
      ),
    )
    .returning({ position: catalogParts.position });
  return rows.length > 0;
}

/** «+ genitore»: the parent as a new last line × 1. False when it would loop, or is there. */
export async function addParent(
  db: Db,
  owner: Owner,
  childId: string,
  parentId: string,
): Promise<boolean> {
  const pasti = await livePasti(db, owner);
  if (childId === parentId || !pasti.has(childId) || !pasti.has(parentId)) return false;
  if ((await heldBy(db, owner, parentId, pasti)).has(childId)) return false;
  if ((await heldBy(db, owner, childId, pasti)).has(parentId)) return false;
  const [last] = await db
    .select({ n: max(catalogParts.position) })
    .from(catalogParts)
    .where(and(ownedBy(catalogParts, owner), eq(catalogParts.itemId, childId)));
  await db.insert(catalogParts).values({
    userId: owner.id,
    itemId: childId,
    position: (last?.n ?? -1) + 1,
    partItemId: parentId,
    quantity: "1",
    unit: null,
  });
  return true;
}

/** The copy rule (as the importer's): «name (2)», «name (3)»… the first free, kept in the cap. */
export async function copyName(db: Db, owner: Owner, name: string): Promise<string> {
  for (let n = 2; ; n++) {
    const tail = ` (${n})`;
    const next = name.slice(0, NAME_MAX - tail.length).trimEnd() + tail;
    if (!(await recipeNameTaken(db, owner, next))) return next;
  }
}

/** «+ figlio»: a new pasto holding this one × 1, named by the copy rule; its id, or null. */
export async function addChild(
  db: Db,
  owner: Owner,
  parentId: string,
): Promise<string | null> {
  const pasti = await livePasti(db, owner);
  const name = pasti.get(parentId);
  if (!name) return null;
  const childName = await copyName(db, owner, name);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(catalogItems)
      .values({
        userId: owner.id,
        catalog: "recipe",
        name: childName,
        basedOnId: parentId,
      })
      .returning({ id: catalogItems.id });
    await tx.insert(catalogParts).values({
      userId: owner.id,
      itemId: row!.id,
      position: 0,
      partItemId: parentId,
      quantity: "1",
      unit: null,
    });
    return row!.id;
  });
}

/** A live pasto's name, or null. */
export async function readRecipeName(
  db: Db,
  owner: Owner,
  id: string,
): Promise<string | null> {
  return (await livePasti(db, owner)).get(id) ?? null;
}

/**
 * «× k» set on a kin link (MOD-23): a stored line takes k; a found one is first stored — the
 * child rewritten as the parent × k plus what is left of its own foods (the same foods at the found
 * k), leaving any ADR-0060 base — then takes k. False when they are not kin, k is not > 0, or the
 * child has variants of its own (their differences are kept against its old parts).
 */
export async function setKin(
  db: Db,
  owner: Owner,
  childId: string,
  parentId: string,
  k: number,
): Promise<boolean> {
  if (!(k > 0) || k > 99) return false;
  if (await setParentK(db, owner, childId, parentId, k)) return true;
  const f = await readRecipeFamily(db, owner);
  if (childId === parentId || !f.family.has(childId) || !f.family.has(parentId))
    return false;
  if ([...f.family.values()].some((x) => x.parentId === childId)) return false;
  const foods = expandParts(childId, f.partsOf);
  const base = expandParts(parentId, f.partsOf);
  const found = kinship([
    { id: childId, own: [], foods },
    { id: parentId, own: [], foods: base },
  ])
    .get(childId)
    ?.find((x) => x.id === parentId);
  if (!found) return false;
  const rest = foods.flatMap((c) => {
    const b = base.find((x) => lineKey(x) === lineKey(c));
    const left = Number(c.quantity) - (b ? Number(b.quantity) * found.k : 0);
    // within the 2 % the link allows, nothing is left of a food
    return left > Number(c.quantity) * 0.02
      ? [{ ...c, quantity: String(+left.toFixed(3)) }]
      : [];
  });
  await db.transaction(async (tx) => {
    await rewriteParts(tx as unknown as Db, owner, childId, [
      { partItemId: parentId, quantity: String(k), unit: null, defaults: {} },
      ...rest,
    ]);
    if (f.family.get(childId)?.parentId && f.family.has(f.family.get(childId)!.parentId!))
      await tx
        .update(catalogItems)
        .set({ parentId: null })
        .where(and(ownedBy(catalogItems, owner), eq(catalogItems.id, childId)));
  });
  return true;
}
