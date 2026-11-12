/**
 * core/plans/read.ts — the input of `dayPlans` for a range of days: the live cicli with their
 * steps (a step without a label named by its items), their skips and overrides, and the
 * sessions done since the earliest ciclo began (PL-30…33). A step's item is a blocco «nel ciclo»
 * (Q-18 (a)) or, until his steps are carried, a scheda: a blocco's objects are the step's keys
 * (a session of its scheda counts, PL-31) and its id goes with the step to the Piano of the day.
 * The blocchi are `day-blocks.ts`.
 * Narrow columns only (Neon bills the bytes): ids, names, days, positions.
 */
import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogParts,
  cycleStepItems,
  cycleSteps,
  decisions,
  entries,
} from "../db/schema";
import type { Occurrence } from "../engines/planning";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { inCycleBlocks, readCycles } from "./cycles-repo";
import { dayPlans, type DayPlan, type PlanCycle } from "./plan";

export async function readDayPlans(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
  today: IsoDate,
): Promise<Map<IsoDate, DayPlan>> {
  const cycles = await readCycles(db, owner, { live: true });

  const live = cycles.filter((c) => c.start !== null && c.start <= to);
  const ids = live.map((c) => c.id);
  const earliest = live.reduce<IsoDate | null>(
    (a, c) => (a === null || c.start! < a ? c.start! : a),
    null,
  );
  const [steps, items, plansDecisions, sessions] =
    ids.length === 0 || earliest === null
      ? [[], [], [], []]
      : await Promise.all([
          db
            .select({
              id: cycleSteps.id,
              cycleId: cycleSteps.cycleId,
              position: cycleSteps.position,
              label: cycleSteps.label,
            })
            .from(cycleSteps)
            .where(and(ownedBy(cycleSteps, owner), inArray(cycleSteps.cycleId, ids))),
          db
            .select({ stepId: cycleStepItems.stepId, itemId: cycleStepItems.itemId })
            .from(cycleStepItems)
            .innerJoin(cycleSteps, eq(cycleSteps.id, cycleStepItems.stepId))
            .where(and(ownedBy(cycleStepItems, owner), inArray(cycleSteps.cycleId, ids))),
          db
            .select({
              kind: decisions.kind,
              day: decisions.day,
              key: decisions.key,
              payload: decisions.payload,
            })
            .from(decisions)
            .where(
              and(
                ownedBy(decisions, owner),
                inArray(decisions.kind, ["cycle_skip", "cycle_override"]),
                inArray(decisions.key, ids),
              ),
            ),
          readSessionKeys(db, owner, earliest),
        ]);

  // A step without a label is named by what it holds (v1's programs: «Pull», «Legs»…).
  const itemIds = [...new Set(items.map((i) => i.itemId))];
  const itemRows =
    itemIds.length === 0
      ? []
      : await db
          .select({ id: catalogItems.id, name: catalogItems.name })
          .from(catalogItems)
          .where(and(ownedBy(catalogItems, owner), inArray(catalogItems.id, itemIds)));
  const itemNames = new Map(itemRows.map((r) => [r.id, r.name] as const));
  const blockIds = await inCycleBlocks(db, owner, itemIds);
  // A blocco's objects, in order: what a session must carry to count for its step (PL-31).
  const partsOf = new Map<string, string[]>();
  if (blockIds.size > 0)
    for (const r of await db
      .select({ itemId: catalogParts.itemId, partItemId: catalogParts.partItemId })
      .from(catalogParts)
      .where(
        and(ownedBy(catalogParts, owner), inArray(catalogParts.itemId, [...blockIds])),
      )
      .orderBy(catalogParts.itemId, catalogParts.position))
      partsOf.set(r.itemId, [...(partsOf.get(r.itemId) ?? []), r.partItemId]);
  const held = new Map<string, string[]>();
  for (const i of items) held.set(i.stepId, [...(held.get(i.stepId) ?? []), i.itemId]);
  const keysOf = (stepId: string) => [
    ...new Set(
      (held.get(stepId) ?? []).flatMap((id) =>
        blockIds.has(id) ? (partsOf.get(id) ?? []) : [id],
      ),
    ),
  ];
  const blocksOf = (stepId: string) =>
    (held.get(stepId) ?? []).filter((id) => blockIds.has(id));
  const labelOf = (s: { id: string; label: string }) =>
    s.label ||
    (held.get(s.id) ?? [])
      .map((k) => itemNames.get(k))
      .filter(Boolean)
      .join(" + ");
  const planCycles: PlanCycle[] = live.map((c) => ({
    id: c.id,
    name: c.name,
    start: c.start!,
    advance: c.advance,
    onSkip: c.onSkip,
    steps: steps
      .filter((s) => s.cycleId === c.id)
      .map((s) => ({
        position: s.position,
        keys: keysOf(s.id),
        label: labelOf(s),
      })),
    blocksAt: new Map(
      steps.filter((s) => s.cycleId === c.id).map((s) => [s.position, blocksOf(s.id)]),
    ),
  }));
  const overrides = new Map<string, { day: IsoDate; position: number | null }[]>();
  const skips = new Map<string, IsoDate[]>();
  for (const d of plansDecisions) {
    if (d.kind === "cycle_skip") skips.set(d.key, [...(skips.get(d.key) ?? []), d.day]);
    else {
      const pos = (d.payload as Record<string, unknown>)["position"];
      overrides.set(d.key, [
        ...(overrides.get(d.key) ?? []),
        { day: d.day, position: typeof pos === "number" ? pos : null },
      ]);
    }
  }
  return dayPlans({
    today,
    from,
    to,
    cycles: planCycles,
    done: sessions,
    overrides,
    skips,
  });
}

/** Each done session since `from` as an occurrence: its routine and its exercises. */
export async function readSessionKeys(
  db: Db,
  owner: Owner,
  from: IsoDate,
): Promise<Occurrence[]> {
  const rows = await db
    .select({ id: entries.id, day: entries.day, itemId: entries.itemId })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "session"),
        eq(entries.status, "done"),
        gte(entries.day, from),
        isNull(entries.deletedAt),
      ),
    );
  if (rows.length === 0) return [];
  const children = await db
    .select({ parentId: entries.parentId, itemId: entries.itemId })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "session_exercise"),
        inArray(
          entries.parentId,
          rows.map((r) => r.id),
        ),
        isNull(entries.deletedAt),
      ),
    );
  const byParent = new Map<string, string[]>();
  for (const c of children)
    if (c.parentId && c.itemId)
      byParent.set(c.parentId, [...(byParent.get(c.parentId) ?? []), c.itemId]);
  return rows.map((r) => ({
    day: r.day,
    keys: [...(r.itemId ? [r.itemId] : []), ...(byParent.get(r.id) ?? [])],
  }));
}
