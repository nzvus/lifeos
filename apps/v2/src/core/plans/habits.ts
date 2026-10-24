/**
 * core/plans/habits.ts — habits (dossiers/day-templates.md slice d;
 * concepts.md §5: «block models with a recurrence; their entries are
 * planned, done or skipped like any other»). A habit is a template of scope
 * `block` with its recurrence (E1 `Recurrence`) and one block: what kind of
 * entry (an activity's category in its defaults), at what time, how long.
 * Nothing is planned in advance: a day shows the habits due and not yet
 * covered — an entry of that kind (and category) on the day, any status —
 * and «N volte a settimana» is due until the week has N.
 */
import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { templateBlocks, templates } from "../db/schema";
import { isoWeek, plannedOn, type IsoDate, type Recurrence } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export type Habit = {
  id: string;
  name: string;
  active: boolean;
  recurrence: Recurrence;
  kind: string;
  /** An activity's category («study»), when the kind has one. */
  category: string | null;
  atMin: number | null;
  durationMin: number | null;
};

/** The kinds a habit can be made of: not meals, sessions, money or pantry. */
export const NOT_HABIT_KINDS = new Set([
  "meal",
  "batch",
  "session",
  "session_exercise",
  "purchase",
  "stock_count",
  "movement",
]);

const isRecurrence = (r: unknown): r is Recurrence => {
  if (typeof r !== "object" || r === null) return false;
  const t = (r as { type?: unknown }).type;
  return (
    t === "daily" ||
    t === "weekdays" ||
    t === "timesPerWeek" ||
    t === "everyN" ||
    t === "onDates"
  );
};

export async function readHabits(db: Db, owner: Owner): Promise<Habit[]> {
  const rows = await db
    .select({
      id: templates.id,
      name: templates.name,
      active: templates.active,
      recurrence: templates.recurrence,
    })
    .from(templates)
    .where(
      and(
        ownedBy(templates, owner),
        eq(templates.scope, "block"),
        isNull(templates.deletedAt),
      ),
    )
    .orderBy(templates.name);
  const ids = rows.map((r) => r.id);
  const blocks = ids.length
    ? await db
        .select({
          templateId: templateBlocks.templateId,
          kind: templateBlocks.kind,
          atMin: templateBlocks.atMin,
          durationMin: templateBlocks.durationMin,
          defaults: templateBlocks.defaults,
        })
        .from(templateBlocks)
        .where(
          and(ownedBy(templateBlocks, owner), inArray(templateBlocks.templateId, ids)),
        )
    : [];
  return rows.flatMap((r) => {
    const b = blocks.find((x) => x.templateId === r.id);
    if (!b?.kind || !isRecurrence(r.recurrence)) return [];
    const category = b.defaults?.["category"];
    return [
      {
        id: r.id,
        name: r.name,
        active: r.active,
        recurrence: r.recurrence,
        kind: b.kind,
        category: typeof category === "string" ? category : null,
        atMin: b.atMin,
        durationMin: b.durationMin,
      },
    ];
  });
}

export type HabitInput = Omit<Habit, "id" | "active">;

/** A habit made (`id` null) or changed; its id, null when not the owner's. */
export async function saveHabit(
  db: Db,
  owner: Owner,
  id: string | null,
  h: HabitInput,
): Promise<string | null> {
  if (NOT_HABIT_KINDS.has(h.kind)) return null;
  const block = {
    kind: h.kind,
    when: (h.atMin === null ? "unset" : "absolute") as "unset" | "absolute",
    atMin: h.atMin,
    durationMin: h.durationMin,
    defaults: h.category ? { category: h.category } : null,
  };
  return db.transaction(async (tx) => {
    if (id === null) {
      const [t] = await tx
        .insert(templates)
        .values({
          userId: owner.id,
          scope: "block",
          name: h.name,
          recurrence: h.recurrence,
        })
        .returning({ id: templates.id });
      await tx
        .insert(templateBlocks)
        .values({ userId: owner.id, templateId: t!.id, position: 0, ...block });
      return t!.id;
    }
    const rows = await tx
      .update(templates)
      .set({ name: h.name, recurrence: h.recurrence })
      .where(
        and(
          ownedBy(templates, owner),
          eq(templates.id, id),
          eq(templates.scope, "block"),
        ),
      )
      .returning({ id: templates.id });
    if (rows.length === 0) return null;
    await tx
      .update(templateBlocks)
      .set(block)
      .where(and(ownedBy(templateBlocks, owner), eq(templateBlocks.templateId, id)));
    return id;
  });
}

export async function setHabitActive(
  db: Db,
  owner: Owner,
  id: string,
  active: boolean,
): Promise<boolean> {
  const rows = await db
    .update(templates)
    .set({ active })
    .where(
      and(ownedBy(templates, owner), eq(templates.id, id), eq(templates.scope, "block")),
    )
    .returning({ id: templates.id });
  return rows.length > 0;
}

/** The entry that covers a habit: its kind, and its category when it has one. */
export const covers = (
  h: Pick<Habit, "kind" | "category">,
  e: { kind: string; category: string | null },
) => e.kind === h.kind && (h.category === null || e.category === h.category);

/**
 * The active habits due on `day` and not covered yet. `week` holds the
 * entries of the day's ISO week (kind, category, day) for «N times a week»:
 * due while the week has fewer than N days covered, not counting this day.
 */
export function habitsDue(
  habits: readonly Habit[],
  day: IsoDate,
  week: readonly { day: IsoDate; kind: string; category: string | null }[],
): Habit[] {
  const { from, to } = isoWeek(day);
  const inWeek = week.filter((e) => e.day >= from && e.day <= to);
  return habits.filter((h) => {
    if (!h.active) return false;
    if (inWeek.some((e) => e.day === day && covers(h, e))) return false;
    if (h.recurrence.type === "timesPerWeek") {
      const days = new Set(
        inWeek.filter((e) => e.day !== day && covers(h, e)).map((e) => e.day),
      );
      return days.size < h.recurrence.n;
    }
    return plannedOn(h.recurrence, day);
  });
}
