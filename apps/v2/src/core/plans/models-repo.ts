/**
 * core/plans/models-repo.ts — reading and writing day models for Piano's
 * editor (dossiers/day-templates.md slice b). Every query `ownedBy` the
 * owner: another person's id reads as not found and changes nothing. A
 * model stores only its differences from its base (concepts §5): its own
 * blocks, rows changing or hiding an inherited block, its own targets'
 * keys. Archiving keeps the model (days planned from it keep its name);
 * a week day pointing to it falls back to none.
 */
import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  entries,
  entryLines,
  entryLineValues,
  entryValues,
  templateBlocks,
  templates,
  weekLayouts,
} from "../db/schema";
import { clockMin } from "../engines/planning";
import type { DayClock, IsoDate } from "../engines/time";
import { mealRoleAt, type RoleBounds } from "../kinds";
import { dayMinute } from "../day/timeline";
import { ownedBy, type Owner } from "../identity/owner";
import { possibleBases, type BlockRow, type ModelRow, type RoleDay } from "./models";

const ROLES = new Set(["breakfast", "lunch", "snack", "dinner"]);

export type ModelBook = {
  models: ModelRow[];
  rows: BlockRow[];
  /** ISO weekday → model id. */
  week: Map<number, string>;
};

/** Every day model (archived ones too), their block rows and the week layout: three queries. */
export async function readModelBook(db: Db, owner: Owner): Promise<ModelBook> {
  const [models, week] = await Promise.all([
    db
      .select({
        id: templates.id,
        name: templates.name,
        extendsId: templates.extendsId,
        targets: templates.targets,
        active: templates.active,
      })
      .from(templates)
      .where(
        and(
          ownedBy(templates, owner),
          eq(templates.scope, "day"),
          isNull(templates.deletedAt),
        ),
      )
      .orderBy(templates.name),
    db
      .select({ weekday: weekLayouts.weekday, templateId: weekLayouts.templateId })
      .from(weekLayouts)
      .where(ownedBy(weekLayouts, owner)),
  ]);
  const ids = models.map((m) => m.id);
  const rows = ids.length
    ? await db
        .select({
          id: templateBlocks.id,
          templateId: templateBlocks.templateId,
          position: templateBlocks.position,
          kind: templateBlocks.kind,
          itemId: templateBlocks.itemId,
          when: templateBlocks.when,
          atMin: templateBlocks.atMin,
          anchorBlockId: templateBlocks.anchorBlockId,
          offsetMin: templateBlocks.offsetMin,
          durationMin: templateBlocks.durationMin,
          cycleId: templateBlocks.cycleId,
          kcalShare: templateBlocks.kcalShare,
          proteinShare: templateBlocks.proteinShare,
          defaults: templateBlocks.defaults,
          baseBlockId: templateBlocks.baseBlockId,
          removed: templateBlocks.removed,
        })
        .from(templateBlocks)
        .where(
          and(ownedBy(templateBlocks, owner), inArray(templateBlocks.templateId, ids)),
        )
    : [];
  return {
    models: models.map((m) => ({
      ...m,
      targets: (m.targets as Record<string, unknown> | null) ?? null,
    })),
    rows: rows as BlockRow[],
    week: new Map(week.map((w) => [w.weekday, w.templateId])),
  };
}

const owned = (owner: Owner, id: string) =>
  and(ownedBy(templates, owner), eq(templates.id, id), eq(templates.scope, "day"));

/** A new day model, empty or on a base; its id. */
export async function createModel(
  db: Db,
  owner: Owner,
  name: string,
  extendsId: string | null,
): Promise<string> {
  const [m] = await db
    .insert(templates)
    .values({ userId: owner.id, scope: "day", name, extendsId })
    .returning({ id: templates.id });
  return m!.id;
}

/**
 * Its name, base and own targets. A base that would make a loop, or is not
 * the owner's, is refused (false), as is an unknown model.
 */
export async function saveModel(
  db: Db,
  owner: Owner,
  id: string,
  m: { name: string; extendsId: string | null; targets: Record<string, unknown> | null },
): Promise<boolean> {
  if (m.extendsId !== null) {
    const { models } = await readModelBook(db, owner);
    if (!possibleBases(id, models).some((b) => b.id === m.extendsId)) return false;
  }
  const rows = await db
    .update(templates)
    .set({ name: m.name, extendsId: m.extendsId, targets: m.targets })
    .where(owned(owner, id))
    .returning({ id: templates.id });
  return rows.length > 0;
}

/** The weekdays (1 Monday … 7 Sunday) this model plans; the others it had go back to none. */
export async function setWeekdays(
  db: Db,
  owner: Owner,
  id: string,
  weekdays: readonly number[],
): Promise<void> {
  await db.transaction(async (tx) => {
    const [m] = await tx
      .select({ id: templates.id })
      .from(templates)
      .where(owned(owner, id));
    if (!m) return;
    await tx
      .delete(weekLayouts)
      .where(and(ownedBy(weekLayouts, owner), eq(weekLayouts.templateId, id)));
    const days = [...new Set(weekdays)].filter((d) => d >= 1 && d <= 7);
    if (days.length === 0) return;
    await tx
      .delete(weekLayouts)
      .where(and(ownedBy(weekLayouts, owner), inArray(weekLayouts.weekday, days)));
    await tx
      .insert(weekLayouts)
      .values(days.map((weekday) => ({ userId: owner.id, weekday, templateId: id })));
  });
}

/** Archived (or back): out of the week and of the bases offered, kept for the days it planned. */
export async function setModelActive(
  db: Db,
  owner: Owner,
  id: string,
  active: boolean,
): Promise<boolean> {
  const rows = await db
    .update(templates)
    .set({ active })
    .where(owned(owner, id))
    .returning({ id: templates.id });
  if (rows.length > 0 && !active)
    await db
      .delete(weekLayouts)
      .where(and(ownedBy(weekLayouts, owner), eq(weekLayouts.templateId, id)));
  return rows.length > 0;
}

/** A copy with the same base, targets and rows («Duplica»); its id, null when not found. */
export async function duplicateModel(
  db: Db,
  owner: Owner,
  id: string,
  name: string,
): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [m] = await tx
      .select({ extendsId: templates.extendsId, targets: templates.targets })
      .from(templates)
      .where(owned(owner, id));
    if (!m) return null;
    const [copy] = await tx
      .insert(templates)
      .values({
        userId: owner.id,
        scope: "day",
        name,
        extendsId: m.extendsId,
        targets: m.targets,
      })
      .returning({ id: templates.id });
    const rows = await tx
      .select()
      .from(templateBlocks)
      .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.templateId, id)));
    // Own blocks get new ids; a relative block keeps pointing to its anchor's copy.
    const ids = new Map(rows.map((r) => [r.id, crypto.randomUUID()]));
    if (rows.length)
      await tx.insert(templateBlocks).values(
        rows.map((r) => ({
          ...r,
          id: ids.get(r.id)!,
          templateId: copy!.id,
          anchorBlockId: r.anchorBlockId
            ? (ids.get(r.anchorBlockId) ?? r.anchorBlockId)
            : null,
        })),
      );
    return copy!.id;
  });
}

export type BlockInput = {
  kind: "meal" | "session";
  /** A meal's role (breakfast, lunch, snack, dinner). */
  role: string | null;
  atMin: number | null;
  durationMin: number | null;
  kcalShare: string | null;
  proteinShare: string | null;
};

const blockValues = (b: BlockInput) => ({
  kind: b.kind,
  when: (b.atMin === null ? "unset" : "absolute") as BlockRow["when"],
  atMin: b.atMin,
  durationMin: b.durationMin,
  kcalShare: b.kind === "meal" ? b.kcalShare : null,
  proteinShare: b.kind === "meal" ? b.proteinShare : null,
  defaults: b.kind === "meal" && b.role ? { role: b.role } : null,
});

/**
 * Writes a block of this model: a new own block (`blockId` null), an own
 * block changed, or an inherited one changed here (a row naming it). False
 * when the model or the block is not the owner's.
 */
export async function saveBlock(
  db: Db,
  owner: Owner,
  modelId: string,
  blockId: string | null,
  b: BlockInput,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [m] = await tx
      .select({ id: templates.id })
      .from(templates)
      .where(owned(owner, modelId));
    if (!m) return false;
    const mine = await tx
      .select({
        id: templateBlocks.id,
        baseBlockId: templateBlocks.baseBlockId,
        position: templateBlocks.position,
      })
      .from(templateBlocks)
      .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.templateId, modelId)));
    const next = mine.reduce((a, r) => Math.max(a, r.position + 1), 0);
    if (blockId === null) {
      await tx.insert(templateBlocks).values({
        userId: owner.id,
        templateId: modelId,
        position: next,
        ...blockValues(b),
      });
      return true;
    }
    if (mine.some((r) => r.id === blockId && r.baseBlockId === null)) {
      await tx
        .update(templateBlocks)
        .set(blockValues(b))
        .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.id, blockId)));
      return true;
    }
    // An inherited block: it must be the owner's; the change is a row of this model naming it.
    const [base] = await tx
      .select({ id: templateBlocks.id })
      .from(templateBlocks)
      .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.id, blockId)));
    if (!base) return false;
    const change = mine.find((r) => r.baseBlockId === blockId);
    if (change)
      await tx
        .update(templateBlocks)
        .set({ ...blockValues(b), removed: false })
        .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.id, change.id)));
    else
      await tx.insert(templateBlocks).values({
        userId: owner.id,
        templateId: modelId,
        position: next,
        baseBlockId: blockId,
        ...blockValues(b),
      });
    return true;
  });
}

/**
 * Takes a block out of this model: an own block is deleted (and blocks
 * timed after it lose that anchor); an inherited one is hidden here.
 */
export async function removeBlock(
  db: Db,
  owner: Owner,
  modelId: string,
  blockId: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [m] = await tx
      .select({ id: templates.id })
      .from(templates)
      .where(owned(owner, modelId));
    if (!m) return false;
    const mine = await tx
      .select({
        id: templateBlocks.id,
        baseBlockId: templateBlocks.baseBlockId,
        position: templateBlocks.position,
      })
      .from(templateBlocks)
      .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.templateId, modelId)));
    if (mine.some((r) => r.id === blockId && r.baseBlockId === null)) {
      await tx
        .update(templateBlocks)
        .set({ when: "unset", anchorBlockId: null })
        .where(
          and(ownedBy(templateBlocks, owner), eq(templateBlocks.anchorBlockId, blockId)),
        );
      await tx
        .delete(templateBlocks)
        .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.id, blockId)));
      return true;
    }
    const [base] = await tx
      .select({ id: templateBlocks.id })
      .from(templateBlocks)
      .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.id, blockId)));
    if (!base) return false;
    await tx
      .delete(templateBlocks)
      .where(
        and(
          ownedBy(templateBlocks, owner),
          eq(templateBlocks.templateId, modelId),
          eq(templateBlocks.baseBlockId, blockId),
        ),
      );
    await tx.insert(templateBlocks).values({
      userId: owner.id,
      templateId: modelId,
      position: mine.reduce((a, r) => Math.max(a, r.position + 1), 0),
      baseBlockId: blockId,
      removed: true,
    });
    return true;
  });
}

/** «Torna alla base»: an inherited block as the base has it again (the change or the hiding gone). */
export async function restoreBlock(
  db: Db,
  owner: Owner,
  modelId: string,
  baseBlockId: string,
): Promise<boolean> {
  const rows = await db
    .delete(templateBlocks)
    .where(
      and(
        ownedBy(templateBlocks, owner),
        eq(templateBlocks.templateId, modelId),
        eq(templateBlocks.baseBlockId, baseBlockId),
      ),
    )
    .returning({ id: templateBlocks.id });
  return rows.length > 0;
}

/**
 * Each done meal with its role (its «role» value, else its time's, as on
 * Oggi), kcal and protein, for `historyShares`: four narrow queries.
 */
export async function readRoleDays(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
  known: { clock: DayClock; roleBounds: RoleBounds },
): Promise<RoleDay[]> {
  const meals = await db
    .select({ id: entries.id, day: entries.day, startAt: entries.startAt })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "meal"),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        gte(entries.day, from),
        lte(entries.day, to),
      ),
    );
  if (meals.length === 0) return [];
  const ids = meals.map((m) => m.id);
  const [servings, lines] = await Promise.all([
    db
      .select({
        entryId: entryValues.entryId,
        field: entryValues.field,
        num: entryValues.num,
        text: entryValues.text,
      })
      .from(entryValues)
      .where(
        and(
          ownedBy(entryValues, owner),
          inArray(entryValues.field, ["servings", "role"]),
          inArray(entryValues.entryId, ids),
        ),
      ),
    db
      .select({
        id: entryLines.id,
        entryId: entryLines.entryId,
        quantity: entryLines.quantity,
      })
      .from(entryLines)
      .where(and(ownedBy(entryLines, owner), inArray(entryLines.entryId, ids))),
  ]);
  const values = lines.length
    ? await db
        .select({
          lineId: entryLineValues.lineId,
          field: entryLineValues.field,
          num: entryLineValues.num,
        })
        .from(entryLineValues)
        .where(
          and(
            ownedBy(entryLineValues, owner),
            inArray(entryLineValues.field, ["kcal", "protein"]),
            inArray(
              entryLineValues.lineId,
              lines.map((l) => l.id),
            ),
          ),
        )
    : [];
  const per100 = new Map<string, { kcal: number; protein: number }>();
  for (const v of values) {
    const p = per100.get(v.lineId) ?? { kcal: 0, protein: 0 };
    p[v.field as "kcal" | "protein"] = Number(v.num);
    per100.set(v.lineId, p);
  }
  const times = new Map(
    servings.filter((s) => s.field === "servings").map((s) => [s.entryId, Number(s.num)]),
  );
  const roles = new Map(
    servings.filter((s) => s.field === "role" && s.text).map((s) => [s.entryId, s.text!]),
  );
  const roleOf = (m: (typeof meals)[number]) => {
    const r = roles.get(m.id);
    if (r && ROLES.has(r)) return r;
    return m.startAt
      ? mealRoleAt(clockMin(dayMinute(m.startAt, m.day, known.clock)), known.roleBounds)
      : "";
  };
  const sum = new Map<string, { kcal: number; protein: number }>();
  for (const l of lines) {
    const p = per100.get(l.id);
    if (!p) continue;
    const t = sum.get(l.entryId) ?? { kcal: 0, protein: 0 };
    const q = Number(l.quantity) / 100;
    sum.set(l.entryId, { kcal: t.kcal + p.kcal * q, protein: t.protein + p.protein * q });
  }
  return meals.map((m) => {
    const s = sum.get(m.id) ?? { kcal: 0, protein: 0 };
    const k = times.get(m.id) ?? 1;
    return {
      day: m.day,
      role: roleOf(m),
      kcal: s.kcal * k,
      protein: s.protein * k,
      minute: m.startAt ? clockMin(dayMinute(m.startAt, m.day, known.clock)) : null,
    };
  });
}
