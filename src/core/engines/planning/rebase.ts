/**
 * E3 Planning — changing a model's base (concepts §5). The editor asks first,
 * listing what changes; local blocks and changes are never lost without
 * saying so.
 * - replace: the inherited blocks become the new base's; local blocks stay;
 *   removals and changes stay where their block still exists, and a change is
 *   a conflict when the new base has a different value for that field than
 *   the old one had; the rest are dropped and listed.
 * - merge: the model keeps what it shows today (inherited blocks the new base
 *   lacks become local, with today's values) and only the new base's missing
 *   blocks are added.
 * - unlink ("Scollega"): no base; the visible blocks become local, with
 *   today's values.
 */
import type { Block, BlockChange, Model } from "./model";
import { resolve } from "./model";

export type Rebase = {
  model: Model;
  /** Changes kept on a block whose new base value differs from the old base's: block id → fields. */
  conflicts: { block: string; fields: string[] }[];
  /** Removals and changes whose block the new base does not have. */
  dropped: string[];
};

type Field = Exclude<keyof Block, "id">;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const strip = ({ origin: _o, ...b }: Block & { origin?: unknown }): Block => b;

export function rebase(
  modelId: string,
  to: string | null,
  mode: "replace" | "merge",
  models: ReadonlyMap<string, Model>,
): Rebase {
  const m = models.get(modelId);
  if (!m) throw new RangeError(`no such model: ${modelId}`);
  const now = resolve(modelId, models);
  if (to === null) {
    const model: Model = { id: m.id, name: m.name, blocks: now.blocks.map(strip) };
    return { model, conflicts: [], dropped: [] };
  }
  // A model can never extend itself or a model built on it.
  const candidate = new Map(models).set(modelId, { ...m, extends: to });
  resolve(modelId, candidate);
  const next = resolve(to, models).blocks;
  const nextById = new Map(next.map((b) => [b.id, b]));

  if (mode === "merge") {
    // What was removed stays hidden where the new base has it too; every other
    // block of the new base the model does not show yet is added.
    const removes = (m.removes ?? []).filter((id) => nextById.has(id));
    const changes: Record<string, BlockChange> = {};
    const blocks: Block[] = [];
    for (const b of now.blocks) {
      const base = nextById.get(b.id);
      if (!base) {
        blocks.push(strip(b));
        continue;
      }
      const diff = diffOf(strip(base), strip(b));
      if (Object.keys(diff).length > 0) changes[b.id] = diff;
    }
    const model: Model = {
      id: m.id,
      name: m.name,
      extends: to,
      blocks,
      removes,
      changes,
    };
    return { model, conflicts: [], dropped: [] };
  }

  const old =
    m.extends === undefined
      ? new Map<string, Block>()
      : new Map(resolve(m.extends, models).blocks.map((b) => [b.id, b]));
  const removes = (m.removes ?? []).filter((id) => nextById.has(id));
  const dropped = (m.removes ?? []).filter((id) => !nextById.has(id));
  const changes: Record<string, BlockChange> = {};
  const conflicts: Rebase["conflicts"] = [];
  for (const [id, change] of Object.entries(m.changes ?? {})) {
    const base = nextById.get(id);
    if (!base) {
      dropped.push(id);
      continue;
    }
    changes[id] = change;
    const was = old.get(id);
    const fields = (Object.keys(change) as Field[]).filter(
      (f) => !was || !same(was[f], base[f]),
    );
    if (fields.length) conflicts.push({ block: id, fields });
  }
  return { model: { ...m, extends: to, removes, changes }, conflicts, dropped };
}

function diffOf(base: Block, b: Block): BlockChange {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(b)]) as Set<keyof Block>;
  for (const k of keys) if (k !== "id" && !same(base[k], b[k])) out[k] = b[k];
  return out as BlockChange;
}
