/**
 * core/plans/day-blocks.ts — the Piano of one day from his blocchi (PL-40, MOD-32; change
 * 2026-11-07-piano, slice 4): the blocchi whose frequency falls on it (`blocksOn`, PL-20, a
 * rotation's item by its last done one, PL-02) and each live ciclo's step due with its scheda
 * (PL-30, PL-33) — its blocchi «nel ciclo» when it holds them (Q-18 (a)) —, placed by the planning engine (E3 `apply`: a clock time, «N min dopo/prima»
 * its anchor's fatto time first, then its previsto one, wake / bed, else the default time of
 * PL-10…12) and left out when the day already has its voce, any status (covered: a voce of its
 * object, or of its type and category, PL-03). Computed on read, nothing stored (PL-41).
 * `dayBlocks` is pure; `readPlanInput` gathers what it needs in three narrow queries.
 */
import { and, eq, gte, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, entries } from "../db/schema";
import { dayMinute } from "../day/timeline";
import {
  apply,
  type Block as EngineBlock,
  type DayEntry,
  type When,
} from "../engines/planning";
import { addDays, type DayClock, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { typeOfItem } from "../kinds/catalog";
import { blocksOn, readBlocks, type Block } from "./blocks";

/** A voce as the Piano reads it: what it is of, when, and how it went. */
export type PlanVoce = {
  id: string;
  day: IsoDate;
  kind: string;
  itemId: string | null;
  /** An activity's category («study»), when it has one. */
  category: string | null;
  minute: number | null;
  status: "planned" | "done" | "skipped";
  /** The blocco it was written from (PL-40), when it was. */
  blockId?: string | null;
};

/** What a blocco, or a ciclo's step, still plans on the day. */
export type PlannedBlock = {
  /** «block:<id>» or «step:<ciclo id>». */
  key: string;
  /** The blocco; null for a ciclo's step. */
  block: Block | null;
  /** The ciclo's step: its ciclo and its words. */
  step: { cycleId: string; label: string } | null;
  /** Its object that day (a rotation's turn, the step's scheda); null for a type. */
  itemId: string | null;
  /** The voce kind it makes: its type, or its object's (a pasto makes a meal). */
  kind: string;
  minute: number | null;
  durationMin: number | null;
};

export type StepDue = {
  cycleId: string;
  label: string;
  itemId: string | null;
  /** Its blocchi «nel ciclo» (Q-18 (a)): planned as blocchi, each with its own when. */
  blockIds?: readonly string[];
};

const whenOf = (b: Block): When => {
  const w = b.when;
  if (w.kind === "time") return { type: "at", min: w.atMin };
  if (w.kind === "after")
    return { type: "after", anchor: "block:" + w.anchorId, offsetMin: w.offsetMin };
  if (w.kind === "before")
    return { type: "after", anchor: "block:" + w.anchorId, offsetMin: -w.offsetMin };
  if (w.kind === "wake") return { type: "afterWake", offsetMin: w.offsetMin };
  if (w.kind === "bed") return { type: "beforeBed", offsetMin: w.offsetMin };
  return { type: "unset" };
};

const category = (b: Block) =>
  typeof b.defaults["category"] === "string" ? b.defaults["category"] : null;

/** A voce covers a blocco when it is of one of its objects, or of its type (and category). */
const covers = (b: Block, v: PlanVoce) =>
  b.kind
    ? v.kind === b.kind && (category(b) === null || v.category === category(b))
    : v.itemId !== null && b.items.some((i) => i.itemId === v.itemId);

/** Each rotation's last done object before the day (PL-02), by blocco id. */
export function lastDone(
  blocks: readonly Block[],
  history: readonly PlanVoce[],
): Map<string, string> {
  const out = new Map<string, string>();
  const done = history
    .filter((v) => v.status === "done" && v.itemId !== null)
    .sort((a, b) => a.day.localeCompare(b.day) || (a.minute ?? 0) - (b.minute ?? 0));
  for (const b of blocks.filter((x) => x.items.length > 1))
    for (const v of done) if (covers(b, v)) out.set(b.id, v.itemId!);
  return out;
}

export function dayBlocks(p: {
  day: IsoDate;
  blocks: readonly Block[];
  /** The voce kind an object makes (a pasto a meal, a scheda a session); null when none. */
  kindOf: (itemId: string) => string | null;
  /** The objects still live: an archived one leaves a rotation (PL-02). */
  live?: ReadonlySet<string>;
  /** The day's voci, any status. */
  voci: readonly PlanVoce[];
  /** The blocchi written on the day already, a trashed voce included: never twice (PL-40). */
  written?: ReadonlySet<string>;
  /** The voci of the days before: the default time (PL-12) and the rotations' turn (PL-02). */
  history: readonly PlanVoce[];
  /** Each ciclo's step due that day, not a rest and not saltato (PL-31…33). */
  steps?: readonly StepDue[];
  wake?: number;
  bed?: number;
}): PlannedBlock[] {
  // A step that holds blocchi «nel ciclo» plans them (PL-30, Q-18 (a)), each with its own
  // when («30 min prima di» another); a step that holds a scheda plans it as the step's row.
  const stepOf = new Map<string, StepDue>();
  for (const s of p.steps ?? [])
    for (const id of s.blockIds ?? []) if (!stepOf.has(id)) stepOf.set(id, s);
  // A blocco «nel ciclo» anchored to one of them comes with it (Q-24 (a)): the caffè «30 min
  // prima di» the Push. Chains follow (caffè before acqua before Push); a loop ends.
  for (let grew = true; grew;) {
    grew = false;
    for (const b of p.blocks) {
      const w = b.when;
      if (b.recurrence.type !== "inCycle" || stepOf.has(b.id)) continue;
      if (w.kind !== "after" && w.kind !== "before") continue;
      const s = stepOf.get(w.anchorId);
      if (s) {
        stepOf.set(b.id, s);
        grew = true;
      }
    }
  }
  const last = lastDone(p.blocks, p.history);
  // A blocco that holds nothing (no live object, no type) plans nothing.
  const due = [
    ...blocksOn(p.blocks, p.day, last, p.live),
    ...blocksOn(
      p.blocks
        .filter((b) => stepOf.has(b.id))
        .map((b) => ({ ...b, recurrence: { type: "daily" } as const })),
      p.day,
      last,
      p.live,
    ),
  ].filter(
    (d, i, all) =>
      (d.block.kind !== null || d.itemId !== null) &&
      !p.written?.has(d.block.id) &&
      all.findIndex((x) => x.block.id === d.block.id) === i,
  );
  const stepRows = (p.steps ?? []).filter((s) => (s.blockIds ?? []).length === 0);
  const kindOf = (b: Block, itemId: string | null) =>
    b.kind ?? (itemId ? p.kindOf(itemId) : null) ?? "";
  const engine: EngineBlock[] = [
    ...due.map(({ block: b, itemId }) => ({
      id: "block:" + b.id,
      kind: kindOf(b, itemId),
      item: itemId ?? undefined,
      when: whenOf(b),
      durationMin: b.durationMin ?? undefined,
    })),
    ...stepRows.map((s) => ({
      id: "step:" + s.cycleId,
      kind: (s.itemId ? p.kindOf(s.itemId) : null) ?? "",
      item: s.itemId ?? undefined,
      when: { type: "unset" } as When,
    })),
  ];
  // Which voce covers which blocco (one voce, one blocco): the engine reads it as `fromBlock`.
  const coverOf = (voci: readonly PlanVoce[], withSteps: boolean) => {
    const used = new Map<string, string>();
    const take = (key: string, fits: (v: PlanVoce) => boolean) => {
      const v = voci.find((x) => !used.has(x.id) && fits(x));
      if (v) used.set(v.id, key);
    };
    // A voce written from a blocco is that blocco's, whatever it holds now.
    for (const v of voci) if (v.blockId) used.set(v.id, "block:" + v.blockId);
    for (const { block: b } of due) take("block:" + b.id, (v) => covers(b, v));
    if (withSteps)
      for (const s of stepRows) {
        const kind = s.itemId ? p.kindOf(s.itemId) : null;
        if (kind) take("step:" + s.cycleId, (v) => v.kind === kind);
      }
    return used;
  };
  const asEntries = (voci: readonly PlanVoce[], withSteps: boolean): DayEntry[] => {
    const used = coverOf(voci, withSteps);
    return voci.map((v) => ({
      id: v.id,
      kind: v.kind,
      item: v.itemId ?? undefined,
      day: v.day,
      at: v.minute ?? undefined,
      status: v.status,
      fromBlock: used.get(v.id),
    }));
  };
  const planned = apply(
    engine,
    {
      date: p.day,
      entries: asEntries(p.voci, true),
      history: p.history.flatMap((v) =>
        // A past day's voce counts for its blocco by what it is of (PL-12 «that blocco»).
        asEntries([v], false),
      ),
      wake: p.wake,
      bed: p.bed,
    },
    (() => {
      let n = 0;
      return () => String(n++);
    })(),
  );
  const byKey = new Map(due.map((d) => ["block:" + d.block.id, d.block]));
  const steps = new Map(stepRows.map((s) => ["step:" + s.cycleId, s]));
  return planned
    .map((e) => {
      const key = e.fromBlock!;
      const block = byKey.get(key) ?? null;
      const step = steps.get(key) ?? (block ? stepOf.get(block.id) : undefined);
      return {
        key,
        block,
        step: step ? { cycleId: step.cycleId, label: step.label } : null,
        itemId: e.item ?? null,
        kind: e.kind,
        minute: e.at ?? null,
        durationMin: e.durationMin ?? null,
      };
    })
    .sort((a, b) => (a.minute ?? 1e9) - (b.minute ?? 1e9));
}

/** How far back the Piano reads his voci: four of each weekday (PL-12) and a rotation's turn. */
export const PLAN_HISTORY_DAYS = 28;

export type PlanItem = {
  name: string;
  catalog: string;
  kind: string | null;
  live: boolean;
};

/**
 * What `dayBlocks` needs besides the day's own voci: his live blocchi, the objects they and the
 * steps hold (name, the voce kind they make, still live), and the voci of the 28 days before
 * `day`, narrow (no values but an activity's category is not read: a type blocco with a
 * category takes its type's time in history).
 */
export async function readPlanInput(
  db: Db,
  owner: Owner,
  day: IsoDate,
  clock: DayClock,
  stepItems: readonly string[] = [],
) {
  const from = addDays(day, -PLAN_HISTORY_DAYS);
  const [blocks, past, writtenRows] = await Promise.all([
    readBlocks(db, owner),
    db
      .select({
        id: entries.id,
        day: entries.day,
        kind: entries.kind,
        itemId: entries.itemId,
        blockId: entries.blockId,
        startAt: entries.startAt,
        status: entries.status,
      })
      .from(entries)
      .where(
        and(
          ownedBy(entries, owner),
          gte(entries.day, from),
          lt(entries.day, day),
          isNull(entries.parentId),
          isNull(entries.deletedAt),
        ),
      ),
    // The blocchi written on the day already, a trashed voce included (PL-40: never twice).
    db
      .select({ blockId: entries.blockId })
      .from(entries)
      .where(
        and(ownedBy(entries, owner), eq(entries.day, day), isNotNull(entries.blockId)),
      ),
  ]);
  const ids = [
    ...new Set([...blocks.flatMap((b) => b.items.map((i) => i.itemId)), ...stepItems]),
  ];
  const rows =
    ids.length === 0
      ? []
      : await db
          .select({
            id: catalogItems.id,
            name: catalogItems.name,
            catalog: catalogItems.catalog,
            archivedAt: catalogItems.archivedAt,
            deletedAt: catalogItems.deletedAt,
          })
          .from(catalogItems)
          .where(and(ownedBy(catalogItems, owner), inArray(catalogItems.id, ids)));
  const items = new Map<string, PlanItem>(
    rows.map((r) => [
      r.id,
      {
        name: r.name,
        catalog: r.catalog,
        kind: typeOfItem(r.catalog)?.savedFrom?.kind ?? null,
        live: r.archivedAt === null && r.deletedAt === null,
      },
    ]),
  );
  const history: PlanVoce[] = past.map((v) => ({
    id: v.id,
    day: v.day,
    kind: v.kind,
    itemId: v.itemId,
    category: null,
    minute: v.startAt ? dayMinute(v.startAt, v.day, clock) : null,
    status: v.status,
    blockId: v.blockId,
  }));
  const written = new Set(writtenRows.flatMap((r) => (r.blockId ? [r.blockId] : [])));
  return { blocks, items, history, written };
}
