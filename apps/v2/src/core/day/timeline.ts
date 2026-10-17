/**
 * core/day/timeline.ts — one logical day as the V-01 timeline (screens.md
 * V-01, concepts §3 and §8). Pure: the rows from `readDay` and the kinds in,
 * the day out. No formatting: numbers stay exact strings, times stay
 * instants and day minutes; the page's formatter writes them.
 *
 * - **Timed** items are sorted by their minute of the logical day (a
 *   `DayMin`: 00:30 after a 04:00 boundary is 1470), an interval at its
 *   start, or at its end when its kind says so (sleep shows at the wake).
 * - **Untimed** items (a day's steps, a check-in with no hour, a meal
 *   with only its day) are kept apart, in the order they were made.
 * - **Children** (a session's exercises) sit under their parent, never on
 *   the day by themselves; their sets come along.
 * - A **planned** entry another entry fulfils is folded into it: the day
 *   shows what happened, with the plan it came from.
 * - **Relations** the kinds declare (meal → session) become tags, from E1.
 */
import {
  daysBetween,
  localParts,
  relate,
  type DayClock,
  type GapRule,
  type IsoDate,
  type TimedEntry,
} from "../engines/time";
import { clockMin, type DayMin } from "../engines/planning";
import { subcategoryOf, type Family, type Kind, type KindRegistry } from "../kinds";
import type { DayRows, EntryRow, MoneyRow, SetRow } from "./read";

export type Value = string | boolean;

export type DayLine = {
  id: string;
  name: string;
  itemId: string | null;
  quantity: string;
  unit: string;
  /** The snapshot per 100 (ADR-0007): field → exact number. */
  values: Record<string, string>;
};

export type DayItem = {
  id: string;
  kind: Kind;
  family: Family;
  subcategory: string | null;
  status: EntryRow["status"];
  start: Date | null;
  end: Date | null;
  /** Where it sits on the day; null when untimed. */
  minute: DayMin | null;
  /** The catalog item it is "of", with its name. */
  item: { id: string; name: string } | null;
  /** Field → value: numbers as exact strings, a ref as the item's id. */
  values: Record<string, Value>;
  lines: DayLine[];
  children: DayItem[];
  sets: SetRow[];
  money: MoneyRow | null;
  /** The planned entry it fulfils (folded into it), if any. */
  fulfils: string | null;
  tags: string[];
  source: EntryRow["source"];
  confidence: string;
  note: string;
};

export type Day = {
  day: IsoDate;
  clock: DayClock;
  timed: DayItem[];
  untimed: DayItem[];
  /** User kinds that could not be read: their entries show as plain items. */
  invalidKinds: { key: string; reason: string }[];
};

/** The minute of the logical day `day` an instant falls at, in the person's zone. */
export function dayMinute(instant: Date, day: IsoDate, clock: DayClock): DayMin {
  const { date, minute } = localParts(instant, clock.timeZone);
  return daysBetween(day, date) * 1440 + minute;
}

const groupBy = <T, K>(rows: readonly T[], key: (r: T) => K): Map<K, T[]> => {
  const out = new Map<K, T[]>();
  for (const r of rows) out.set(key(r), [...(out.get(key(r)) ?? []), r]);
  return out;
};

export function composeDay(rows: DayRows, registry: KindRegistry): Day {
  const values = groupBy(rows.values, (v) => v.entryId);
  const lines = groupBy(rows.lines, (l) => l.entryId);
  const lineValues = groupBy(rows.lineValues, (v) => v.lineId);
  const sets = groupBy(rows.sets, (s) => s.entryId);
  const money = new Map(rows.money.map((m) => [m.entryId, m]));
  const names = new Map(rows.items.map((i) => [i.id, i.name]));
  const live = new Set(rows.entries.map((e) => e.id));

  // done → the planned entry it fulfils; the planned one leaves the day.
  const fulfils = new Map<string, string>();
  for (const l of rows.links)
    if (l.relation === "fulfils" && live.has(l.toId)) fulfils.set(l.fromId, l.toId);
  const folded = new Set(fulfils.values());

  const toItem = (e: EntryRow): DayItem => {
    const kind = registry.get(e.kind);
    const vals: Record<string, Value> = {};
    for (const v of values.get(e.id) ?? [])
      vals[v.field] = v.num ?? v.text ?? v.bool ?? v.refItemId ?? "";
    const anchor = kind.anchor === "end" && e.endAt ? e.endAt : e.startAt;
    const minute = anchor ? dayMinute(anchor, rows.day, rows.clock) : null;
    return {
      id: e.id,
      kind,
      family: kind.family,
      subcategory: subcategoryOf(
        kind,
        new Map(Object.entries(vals)),
        minute === null ? null : clockMin(minute),
        rows.roleBounds,
      ),
      status: e.status,
      start: e.startAt,
      end: e.endAt,
      minute,
      item: e.itemId ? { id: e.itemId, name: names.get(e.itemId) ?? "" } : null,
      values: vals,
      lines: (lines.get(e.id) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((l) => ({
          id: l.id,
          name: l.name,
          itemId: l.itemId,
          quantity: l.quantity,
          unit: l.unit,
          values: Object.fromEntries(
            (lineValues.get(l.id) ?? []).map((v) => [v.field, v.num]),
          ),
        })),
      children: [],
      sets: (sets.get(e.id) ?? []).sort((a, b) => a.position - b.position),
      money: money.get(e.id) ?? null,
      fulfils: fulfils.get(e.id) ?? null,
      tags: [],
      source: e.source,
      confidence: e.confidence,
      note: e.note,
    };
  };

  const byCreation = [...rows.entries].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
  const items = new Map(
    byCreation.filter((e) => !folded.has(e.id)).map((e) => [e.id, toItem(e)]),
  );

  // Children under their parent, in their position; an orphan (its parent is
  // on another day or deleted) stays on the day rather than vanish.
  const roots: DayItem[] = [];
  for (const e of byCreation) {
    const item = items.get(e.id);
    if (!item) continue;
    const parent = e.parentId ? items.get(e.parentId) : undefined;
    if (parent) parent.children.push(item);
    else roots.push(item);
  }
  const position = (i: DayItem) => Number(i.values["position"] ?? 0);
  for (const r of roots) r.children.sort((a, b) => position(a) - position(b));

  // Relations: the gap rules every kind on the day declares.
  const rules: GapRule[] = [];
  for (const k of new Set(roots.map((r) => r.kind)))
    for (const r of k.relations) rules.push({ from: k.key, to: r.to, bands: r.bands });
  const timedEntries: TimedEntry[] = roots
    .filter((r) => r.start !== null)
    .map((r) => ({
      id: r.id,
      kind: r.kind.key,
      at: r.start!,
      ...(r.end ? { end: r.end } : {}),
      status: r.status,
    }));
  const related = relate(timedEntries, rules);
  for (const r of roots) r.tags = related.get(r.id)?.tags ?? [];

  const timed = roots
    .filter((r) => r.minute !== null)
    .sort((a, b) => a.minute! - b.minute! || a.id.localeCompare(b.id));
  const untimed = roots.filter((r) => r.minute === null);
  return {
    day: rows.day,
    clock: rows.clock,
    timed,
    untimed,
    invalidKinds: [...registry.invalid],
  };
}
