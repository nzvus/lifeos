/**
 * core/plans/read.ts — the input of `dayPlans` for a range of days: the live
 * day models, the week layout, the days' fixed copies, the active cycles
 * with their steps (a step without a label named by its items), and the
 * sessions done since the earliest cycle began.
 * Narrow columns only (Neon bills the bytes): ids, names, days, positions.
 */
import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  cycleStepItems,
  cycleSteps,
  cyclesState,
  decisions,
  entries,
  templates,
  weekLayouts,
} from "../db/schema";
import type { Occurrence } from "../engines/planning";
import { isoWeekday, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { dayPlans, type DayPlan, type PlanCycle } from "./plan";

export async function readDayPlans(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
  today: IsoDate,
): Promise<Map<IsoDate, DayPlan>> {
  const [models, week, fixed, cycles] = await Promise.all([
    db
      .select({
        id: templates.id,
        name: templates.name,
        scope: templates.scope,
        targets: templates.targets,
      })
      .from(templates)
      .where(
        and(
          ownedBy(templates, owner),
          inArray(templates.scope, ["day", "cycle"]),
          eq(templates.active, true),
          isNull(templates.deletedAt),
        ),
      ),
    db
      .select({ weekday: weekLayouts.weekday, templateId: weekLayouts.templateId })
      .from(weekLayouts)
      .where(ownedBy(weekLayouts, owner)),
    db
      .select({ day: decisions.day, payload: decisions.payload })
      .from(decisions)
      .where(
        and(
          ownedBy(decisions, owner),
          eq(decisions.kind, "day_targets"),
          gte(decisions.day, from),
          lte(decisions.day, to),
        ),
      ),
    db
      .select({
        id: templates.id,
        start: templates.startDay,
        advance: cyclesState.advance,
        onSkip: cyclesState.onSkip,
      })
      .from(templates)
      .leftJoin(cyclesState, eq(cyclesState.cycleId, templates.id))
      .where(
        and(
          ownedBy(templates, owner),
          eq(templates.scope, "cycle"),
          eq(templates.active, true),
          isNull(templates.deletedAt),
        ),
      ),
  ]);
  const names = new Map(models.map((m) => [m.id, m.name]));
  const dayModels = new Map(
    models.filter((m) => m.scope === "day").map((m) => [m.id, m.name]),
  );
  const fixedModels = new Map<IsoDate, string>();
  for (const f of fixed) {
    const p = f.payload as Record<string, unknown>;
    if (typeof p["profileId"] === "string") fixedModels.set(f.day, p["profileId"]);
  }

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

  const keys = new Map<string, string[]>();
  for (const i of items) keys.set(i.stepId, [...(keys.get(i.stepId) ?? []), i.itemId]);
  // A step without a label is named by what it holds (v1's programs: «Pull», «Legs»…).
  const itemIds = [...new Set(items.map((i) => i.itemId))];
  const itemNames = new Map(
    itemIds.length === 0
      ? []
      : (
          await db
            .select({ id: catalogItems.id, name: catalogItems.name })
            .from(catalogItems)
            .where(and(ownedBy(catalogItems, owner), inArray(catalogItems.id, itemIds)))
        ).map((r) => [r.id, r.name] as const),
  );
  const labelOf = (s: { id: string; label: string }) =>
    s.label ||
    (keys.get(s.id) ?? [])
      .map((k) => itemNames.get(k))
      .filter(Boolean)
      .join(" + ");
  const planCycles: PlanCycle[] = live.map((c) => ({
    id: c.id,
    name: names.get(c.id) ?? "",
    start: c.start!,
    advance: c.advance ?? "occurrence",
    onSkip: c.onSkip ?? "lose",
    steps: steps
      .filter((s) => s.cycleId === c.id)
      .map((s) => ({
        position: s.position,
        keys: keys.get(s.id) ?? [],
        label: labelOf(s),
      })),
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
    models: dayModels,
    modelTargets: new Map(
      models
        .filter((m) => m.scope === "day")
        .map((m) => [m.id, (m.targets as Record<string, unknown> | null) ?? null]),
    ),
    week: new Map(week.map((w) => [w.weekday, w.templateId])),
    fixed: fixedModels,
    cycles: planCycles,
    done: sessions,
    overrides,
    skips,
  });
}

/** Each done session since `from` as an occurrence: its routine and its exercises. */
async function readSessionKeys(
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

/**
 * The day's model with its targets, alone (core/day's resolution on pages
 * that need no cycles): the day's fixed copy, else the week layout's.
 */
export async function readDayModel(
  db: Db,
  owner: Owner,
  day: IsoDate,
): Promise<{ name: string; targets: Record<string, unknown> | null } | null> {
  const [fixed, week] = await Promise.all([
    db
      .select({ payload: decisions.payload })
      .from(decisions)
      .where(
        and(
          ownedBy(decisions, owner),
          eq(decisions.kind, "day_targets"),
          eq(decisions.day, day),
        ),
      ),
    db
      .select({ templateId: weekLayouts.templateId })
      .from(weekLayouts)
      .where(and(ownedBy(weekLayouts, owner), eq(weekLayouts.weekday, isoWeekday(day)))),
  ]);
  const own = (fixed[0]?.payload as Record<string, unknown> | undefined)?.["profileId"];
  const id = typeof own === "string" ? own : week[0]?.templateId;
  if (!id) return null;
  const [m] = await db
    .select({ name: templates.name, targets: templates.targets })
    .from(templates)
    .where(
      and(
        ownedBy(templates, owner),
        eq(templates.id, id),
        eq(templates.scope, "day"),
        eq(templates.active, true),
        isNull(templates.deletedAt),
      ),
    );
  return m
    ? { name: m.name, targets: (m.targets as Record<string, unknown> | null) ?? null }
    : null;
}
