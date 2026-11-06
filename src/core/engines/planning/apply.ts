/**
 * E3 Planning — applying a day model to a date, and swapping it mid-day
 * (engines.md E3, concepts §5).
 * - `apply` writes planned entries linked to their blocks (`fromBlock`); a
 *   block that already has an entry on that day is not planned again.
 * - Relative blocks resolve against the day's actual entries first, then
 *   the planned ones: "40 min after the session" is the real start, else
 *   the planned one. A skipped entry is not a time: the anchor's own block
 *   places it.
 * - A block without a time (or whose anchor cannot be placed) takes the
 *   last time used for that block, else that kind, on the same weekday;
 *   else the kind's default; else no time (it sits at the end of the day).
 *   This replaces v1's fixed 17:30 (01 I-9).
 * - A block bound to a cycle takes the step due that day: "training takes the
 *   next step". On a rest it plans nothing.
 */
import type { IsoDate } from "../time/date";
import { isoWeekday } from "../time/date";
import type { Step } from "./cycle";
import { isRest } from "./cycle";
import type { Block } from "./model";
import type { DayMin } from "./time";

export type DayEntry = {
  id: string;
  kind: string;
  item?: string | undefined;
  day: IsoDate;
  /** Absent when the time is unknown. */
  at?: DayMin | undefined;
  durationMin?: number | undefined;
  status: "planned" | "done" | "skipped";
  /** The model block it was planned from (a `from-block` link). */
  fromBlock?: string | undefined;
  values?: Readonly<Record<string, string | number | boolean>> | undefined;
  shares?: Block["shares"];
};

export type DayContext = {
  date: IsoDate;
  /** The entries already on that day, any status. */
  entries: readonly DayEntry[];
  /** Today's wake and bed times, if known (from sleep, or the person's usual). */
  wake?: DayMin | undefined;
  bed?: DayMin | undefined;
  /** Past entries, for the default time. */
  history: readonly DayEntry[];
  /** A kind's default time, when history has none. */
  kindDefault?: ReadonlyMap<string, DayMin> | undefined;
  /** The step each cycle has due on this day (`cyclePlan`), by cycle id. */
  steps?: ReadonlyMap<string, Step> | undefined;
};

/** The planned entries the blocks add to the day, in the blocks' order. */
export function apply(
  blocks: readonly Block[],
  ctx: DayContext,
  newId: () => string,
): DayEntry[] {
  const present = new Set(ctx.entries.flatMap((e) => (e.fromBlock ? [e.fromBlock] : [])));
  const byId = new Map(blocks.map((b) => [b.id, b]));
  const placed = new Map<string, DayMin | undefined>();
  const placing = new Set<string>();

  /** A block's time: from the day's entries if it has one, else resolved from its `when`. */
  const timeOf = (id: string): DayMin | undefined => {
    const live = ctx.entries.filter((e) => e.fromBlock === id && e.status !== "skipped");
    const actual = live.find((e) => e.status === "done" && e.at !== undefined);
    const planned = live.find((e) => e.status === "planned" && e.at !== undefined);
    if (actual ?? planned) return (actual ?? planned)!.at;
    const b = byId.get(id);
    if (!b || live.length > 0) return undefined;
    if (placed.has(id)) return placed.get(id);
    if (placing.has(id)) return undefined; // anchors in a loop: no time from each other
    placing.add(id);
    const t = whenOf(b) ?? defaultTime(b, ctx);
    placing.delete(id);
    placed.set(id, t);
    return t;
  };

  const whenOf = (b: Block): DayMin | undefined => {
    const w = b.when;
    switch (w.type) {
      case "at":
        return w.min;
      case "after": {
        const t = timeOf(w.anchor);
        return t === undefined ? undefined : t + w.offsetMin;
      }
      case "afterWake":
        return ctx.wake === undefined ? undefined : ctx.wake + w.offsetMin;
      case "beforeBed":
        return ctx.bed === undefined ? undefined : ctx.bed - w.offsetMin;
      case "unset":
        return undefined;
    }
  };

  /** A bound block plans the step due, or nothing on a rest or when no step is known. */
  const stepOf = (b: Block): Step | undefined | null =>
    b.cycle === undefined ? undefined : (ctx.steps?.get(b.cycle) ?? null);
  return blocks
    .filter((b) => !present.has(b.id))
    .filter((b) => {
      const s = stepOf(b);
      return s === undefined || (s !== null && !isRest(s));
    })
    .map((b) => ({
      id: newId(),
      kind: b.kind,
      item: stepOf(b)?.keys[0] ?? b.item,
      day: ctx.date,
      at: timeOf(b.id),
      durationMin: b.durationMin,
      status: "planned" as const,
      fromBlock: b.id,
      values: b.defaults,
      shares: b.shares,
    }));
}

/** The last time used for this block, else this kind, on the same weekday before the date; else the kind's default. */
export function defaultTime(b: Block, ctx: DayContext): DayMin | undefined {
  const wd = isoWeekday(ctx.date);
  const past = ctx.history.filter(
    (e) =>
      e.status === "done" &&
      e.at !== undefined &&
      e.day < ctx.date &&
      isoWeekday(e.day) === wd,
  );
  const last = (xs: DayEntry[]) =>
    xs.reduce<DayEntry | undefined>(
      (a, e) => (!a || e.day > a.day || (e.day === a.day && e.at! < a.at!) ? e : a),
      undefined,
    )?.at;
  return (
    last(past.filter((e) => e.fromBlock === b.id)) ??
    last(past.filter((e) => e.kind === b.kind)) ??
    ctx.kindDefault?.get(b.kind)
  );
}

export type Swap = {
  remove: DayEntry[];
  add: DayEntry[];
  /** Applying it puts the day back: delete what was added, restore what was removed. */
  undo: { remove: string[]; restore: DayEntry[] };
};

/**
 * Swap the day's model mid-day: done and skipped entries stay, and so do planned ones
 * typed by hand and those already behind `now`; planned entries from a model ahead of
 * `now` are replaced by the new model's blocks ahead of `now`. An unknown time is at the
 * end of the day. For a future day pass `now = -Infinity`.
 */
export function swap(
  blocks: readonly Block[],
  ctx: DayContext,
  now: DayMin,
  newId: () => string,
): Swap {
  const ahead = (e: DayEntry) => (e.at ?? Infinity) > now;
  const remove = ctx.entries.filter(
    (e) => e.status === "planned" && e.fromBlock !== undefined && ahead(e),
  );
  const kept = ctx.entries.filter((e) => !remove.includes(e));
  const add = apply(blocks, { ...ctx, entries: kept }, newId).filter(ahead);
  return { remove, add, undo: { remove: add.map((e) => e.id), restore: remove } };
}
