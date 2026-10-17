/**
 * E3 Planning — models and `extends` (concepts §5, ADR-0054). A model built
 * on a base stores only its differences: blocks it adds, inherited blocks it
 * removes, fields it changes on an inherited block. Everything else follows
 * the base, through any number of levels.
 */
import type { DayMin } from "./time";

/** When a block happens. Offsets are minutes; "after" takes a negative offset for "before". */
export type When =
  | { type: "at"; min: DayMin }
  | { type: "after"; anchor: string; offsetMin: number }
  | { type: "afterWake"; offsetMin: number }
  | { type: "beforeBed"; offsetMin: number }
  /** No time: the default time (E3), else unknown. */
  | { type: "unset" };

export type Block = {
  id: string;
  kind: string;
  item?: string | undefined;
  when: When;
  durationMin?: number | undefined;
  /** A meal block's share of the day's kcal and protein (E5). */
  shares?: { kcal?: number; protein?: number } | undefined;
  /** Values the planned entry starts with. */
  defaults?: Readonly<Record<string, string | number | boolean>> | undefined;
};

export type BlockChange = Partial<Omit<Block, "id">>;

export type Model = {
  id: string;
  name: string;
  extends?: string | undefined;
  /** The model's own blocks. */
  blocks: readonly Block[];
  /** Inherited blocks hidden here (kept in the base). */
  removes?: readonly string[] | undefined;
  /** Fields changed here on inherited blocks, by block id. */
  changes?: Readonly<Record<string, BlockChange>> | undefined;
};

/** Where a block comes from, seen from the model being resolved. */
export type Origin = "base" | "local" | "changed";
export type ResolvedBlock = Block & { origin: Origin };

export type Resolved = {
  /** The blocks the model plans: inherited ones in the base's order, then its own. */
  blocks: ResolvedBlock[];
  /** Inherited blocks removed here, with the base's values: the editor's way back. */
  removed: ResolvedBlock[];
  /** Removals or changes naming a block the base no longer has (after the base changed). */
  stale: string[];
};

/** The model as it plans, with its bases applied. Throws on a loop or an unknown model. */
export function resolve(id: string, models: ReadonlyMap<string, Model>): Resolved {
  return walk(id, models, []);
}

function walk(id: string, models: ReadonlyMap<string, Model>, path: string[]): Resolved {
  if (path.includes(id))
    throw new RangeError(`a model cannot extend itself: ${[...path, id].join(" → ")}`);
  const m = models.get(id);
  if (!m) throw new RangeError(`no such model: ${id}`);
  const base =
    m.extends === undefined ? [] : walk(m.extends, models, [...path, id]).blocks;
  const removes = new Set(m.removes ?? []);
  const changes = m.changes ?? {};
  const blocks: ResolvedBlock[] = [];
  const removed: ResolvedBlock[] = [];
  for (const b of base) {
    const inherited: ResolvedBlock = { ...b, origin: "base" };
    const change = changes[b.id];
    if (removes.has(b.id)) removed.push(inherited);
    else if (change) blocks.push({ ...b, ...change, id: b.id, origin: "changed" });
    else blocks.push(inherited);
  }
  const baseIds = new Set(base.map((b) => b.id));
  for (const b of m.blocks) {
    if (baseIds.has(b.id))
      throw new RangeError(`block ${b.id} is both inherited and local`);
    blocks.push({ ...b, origin: "local" });
  }
  const stale = [...removes, ...Object.keys(changes)].filter((b) => !baseIds.has(b));
  return { blocks, removed, stale };
}
