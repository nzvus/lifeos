/**
 * core/plans/models.ts — day models as the editor and the day read them
 * (dossiers/day-templates.md §4–§5, slice b). Pure; `models-repo.ts` reads
 * and writes the rows.
 *   blocks   a model's rows are its own blocks, or rows naming an inherited
 *            block (`baseBlockId`) that change it (their non-null fields
 *            win) or hide it (`removed`): E3's Model (`resolve`);
 *   targets  inherited key by key: a key the model sets is its own, the
 *            rest come from its base, through any number of levels;
 *   shares   a meal block's share of the day's kcal and protein, from the
 *            person's own days (§9.3): each role's mean share over the days
 *            that had it, scaled so the roles add up to the whole.
 */
import {
  resolve,
  type Block,
  type BlockChange,
  type Model,
  type Resolved,
  type When,
} from "../engines/planning";

/** The columns of `template_blocks` the editor reads. */
export type BlockRow = {
  id: string;
  templateId: string;
  position: number;
  kind: string | null;
  itemId: string | null;
  when: "absolute" | "after_block" | "after_wake" | "before_bed" | "unset" | null;
  atMin: number | null;
  anchorBlockId: string | null;
  offsetMin: number | null;
  durationMin: number | null;
  cycleId: string | null;
  kcalShare: string | null;
  proteinShare: string | null;
  defaults: Record<string, unknown> | null;
  baseBlockId: string | null;
  removed: boolean;
};

export type ModelRow = {
  id: string;
  name: string;
  extendsId: string | null;
  targets: Record<string, unknown> | null;
  active: boolean;
};

/** A row's time as E3 reads it; null when the row keeps the base's. */
export function rowWhen(r: BlockRow): When | null {
  switch (r.when) {
    case "absolute":
      return r.atMin === null ? { type: "unset" } : { type: "at", min: r.atMin };
    case "after_block":
      return r.anchorBlockId === null
        ? { type: "unset" }
        : { type: "after", anchor: r.anchorBlockId, offsetMin: r.offsetMin ?? 0 };
    case "after_wake":
      return { type: "afterWake", offsetMin: r.offsetMin ?? 0 };
    case "before_bed":
      return { type: "beforeBed", offsetMin: r.offsetMin ?? 0 };
    case "unset":
      return { type: "unset" };
    default:
      return null;
  }
}

const share = (v: string | null) => (v === null ? undefined : Number(v));
const plainDefaults = (d: Record<string, unknown> | null) =>
  d
    ? (Object.fromEntries(
        Object.entries(d).filter(([, v]) =>
          ["string", "number", "boolean"].includes(typeof v),
        ),
      ) as Record<string, string | number | boolean>)
    : undefined;

function blockOf(r: BlockRow): Block {
  const kcal = share(r.kcalShare);
  const protein = share(r.proteinShare);
  return {
    id: r.id,
    kind: r.kind ?? "",
    ...(r.itemId ? { item: r.itemId } : {}),
    when: rowWhen(r) ?? { type: "unset" },
    ...(r.durationMin !== null ? { durationMin: r.durationMin } : {}),
    ...(kcal !== undefined || protein !== undefined
      ? {
          shares: {
            ...(kcal !== undefined ? { kcal } : {}),
            ...(protein !== undefined ? { protein } : {}),
          },
        }
      : {}),
    ...(r.cycleId ? { cycle: r.cycleId } : {}),
    ...(r.defaults ? { defaults: plainDefaults(r.defaults) } : {}),
  };
}

function changeOf(r: BlockRow): BlockChange {
  const c: BlockChange = {};
  if (r.kind !== null) c.kind = r.kind;
  if (r.itemId !== null) c.item = r.itemId;
  const when = rowWhen(r);
  if (when !== null) c.when = when;
  if (r.durationMin !== null) c.durationMin = r.durationMin;
  if (r.kcalShare !== null || r.proteinShare !== null)
    c.shares = {
      ...(r.kcalShare !== null ? { kcal: Number(r.kcalShare) } : {}),
      ...(r.proteinShare !== null ? { protein: Number(r.proteinShare) } : {}),
    };
  if (r.cycleId !== null) c.cycle = r.cycleId;
  if (r.defaults !== null) c.defaults = plainDefaults(r.defaults);
  return c;
}

/** The rows as E3's models, by id. */
export function toModels(
  models: readonly ModelRow[],
  rows: readonly BlockRow[],
): Map<string, Model> {
  const out = new Map<string, Model>();
  for (const m of models) {
    const mine = rows
      .filter((r) => r.templateId === m.id)
      .sort((a, b) => a.position - b.position);
    out.set(m.id, {
      id: m.id,
      name: m.name,
      ...(m.extendsId && models.some((x) => x.id === m.extendsId)
        ? { extends: m.extendsId }
        : {}),
      blocks: mine.filter((r) => r.baseBlockId === null).map(blockOf),
      removes: mine
        .filter((r) => r.baseBlockId !== null && r.removed)
        .map((r) => r.baseBlockId!),
      changes: Object.fromEntries(
        mine
          .filter((r) => r.baseBlockId !== null && !r.removed)
          .map((r) => [r.baseBlockId!, changeOf(r)]),
      ),
    });
  }
  return out;
}

/** A model resolved with its bases; null for an unknown one or a loop (the editor prevents both). */
export function resolveModel(
  id: string,
  models: ReadonlyMap<string, Model>,
): Resolved | null {
  try {
    return resolve(id, models);
  } catch {
    return null;
  }
}

/** The models a model may extend: not itself, nor any model built on it (a loop). */
export function possibleBases(
  id: string | null,
  models: readonly ModelRow[],
): ModelRow[] {
  if (id === null) return [...models];
  const above = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const m of models)
      if (m.extendsId && above.has(m.extendsId) && !above.has(m.id)) {
        above.add(m.id);
        grew = true;
      }
  }
  return models.filter((m) => !above.has(m.id));
}

/** Its targets with the inherited ones, and which keys are its own. */
export function inheritedTargets(
  id: string,
  models: readonly ModelRow[],
): {
  targets: Record<string, unknown> | null;
  own: string[];
  from: Record<string, string>;
} {
  const byId = new Map(models.map((m) => [m.id, m]));
  const chain: ModelRow[] = [];
  for (
    let m = byId.get(id);
    m && !chain.includes(m);
    m = m.extendsId ? byId.get(m.extendsId) : undefined
  )
    chain.push(m);
  const targets: Record<string, unknown> = {};
  const from: Record<string, string> = {};
  for (const m of [...chain].reverse())
    for (const [k, v] of Object.entries(m.targets ?? {}))
      if (v !== null && v !== undefined) {
        targets[k] = v;
        from[k] = m.name;
      }
  const own = Object.keys(chain[0]?.targets ?? {}).filter(
    (k) => chain[0]!.targets![k] !== null && chain[0]!.targets![k] !== undefined,
  );
  return { targets: Object.keys(targets).length ? targets : null, own, from };
}

/** `minute`: when it was eaten (the local clock), null when untimed. */
export type RoleDay = {
  day: string;
  role: string;
  kcal: number;
  protein: number;
  minute?: number | null;
};

/**
 * Each meal role's share of the day's kcal and protein from the person's
 * days (§9.3): per day, a role's part of what the day's meals held; the mean
 * over the days the role appears; then scaled so the roles add up to 1.
 * Days with under 1 000 kcal logged are left out (an incomplete log).
 */
export function historyShares(
  rows: readonly RoleDay[],
): Record<string, { kcal: number; protein: number; days: number; atMin: number | null }> {
  const days = new Map<string, RoleDay[]>();
  for (const r of rows) days.set(r.day, [...(days.get(r.day) ?? []), r]);
  const sums = new Map<string, { kcal: number; protein: number; days: number }>();
  for (const list of days.values()) {
    const kcal = list.reduce((a, r) => a + r.kcal, 0);
    const protein = list.reduce((a, r) => a + r.protein, 0);
    if (kcal < 1000) continue;
    const byRole = new Map<string, { kcal: number; protein: number }>();
    for (const r of list) {
      const b = byRole.get(r.role) ?? { kcal: 0, protein: 0 };
      byRole.set(r.role, { kcal: b.kcal + r.kcal, protein: b.protein + r.protein });
    }
    // A meal without a role (a coffee) counts in the day, not as a block of its own.
    for (const [role, v] of byRole) {
      if (role === "") continue;
      const s = sums.get(role) ?? { kcal: 0, protein: 0, days: 0 };
      sums.set(role, {
        kcal: s.kcal + v.kcal / kcal,
        protein: s.protein + (protein > 0 ? v.protein / protein : 0),
        days: s.days + 1,
      });
    }
  }
  // Each role's usual time: the median of its meals' times, to the quarter hour.
  const times = new Map<string, number[]>();
  for (const r of rows)
    if (r.role && typeof r.minute === "number")
      times.set(r.role, [...(times.get(r.role) ?? []), r.minute]);
  const median = (xs: number[] | undefined) => {
    if (!xs?.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    const m =
      s.length % 2
        ? s[(s.length - 1) / 2]!
        : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
    return Math.round(m / 15) * 15;
  };
  const mean = [...sums].map(
    ([role, s]) =>
      [
        role,
        { kcal: s.kcal / s.days, protein: s.protein / s.days, days: s.days },
      ] as const,
  );
  const k = mean.reduce((a, [, s]) => a + s.kcal, 0) || 1;
  const p = mean.reduce((a, [, s]) => a + s.protein, 0) || 1;
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  return Object.fromEntries(
    mean.map(([role, s]) => [
      role,
      {
        kcal: r3(s.kcal / k),
        protein: r3(s.protein / p),
        days: s.days,
        atMin: median(times.get(role)),
      },
    ]),
  );
}

export type { Model, Resolved, ResolvedBlock } from "../engines/planning";
