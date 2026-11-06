/**
 * E2 Metrics — `metric(entries, definition, window)` (engines.md E2, concepts §6):
 * a declared derivation over entries, computed on read, never stored.
 * - Buckets come from E1's windows; a bucket's days without data are left
 *   out by `over()`, and a bucket with none is unknown, never zero.
 * - A day has data when it holds an entry of the source kind in a counted
 *   status, before the other filters: a logged day with no snack after
 *   21:00 is 0 kcal after 21:00, an unlogged one is unknown.
 * - Sums, means, min/max are exact decimals (big.js), returned unrounded.
 * - Per kg divides by the trend weight (E4), passed in until E4 exists.
 */
import Big from "big.js";
import type { IsoDate } from "../time/date";
import type { Over, Window } from "../time/window";
import { contains, daysOf, isoWeek, month, over } from "../time/window";
import { circularTime, regularity } from "./metrics";

/** What `metric()` reads of an entry (concepts §3); a composite passes its lines' totals in `values`. */
export type MetricEntry = {
  id: string;
  kind: string;
  /** Logical day (E1 `logicalDay`). */
  day: IsoDate;
  /** Local minute of the start, 0…1439; absent when the time is unknown (it sits at the end of its day). */
  minute?: number | undefined;
  status: "planned" | "done" | "skipped";
  values: Readonly<Record<string, string | number | boolean | undefined>>;
  /** Catalog item, for a metric of one food, one exercise… */
  item?: string;
  /** Tags from E1 `relate()`, e.g. "post-workout". */
  tags?: readonly string[];
  /** The entry it belongs to (a set's session), for metrics per session. */
  parent?: string | undefined;
};

export type Filter = {
  /** Default ["done"]; ["done", "planned"] is the day with the plan. Skipped never counts as a value. */
  status?: readonly ("planned" | "done")[];
  item?: string;
  tag?: string;
  /** Time of day, both ends included; wraps past midnight when from > to (21:00 → 03:59 is 1260 → 239). */
  minutes?: { from: number; to: number };
};

export type Aggregate =
  | { type: "sum" | "mean" | "min" | "max" | "first" | "last" }
  | { type: "count" }
  /** 1 − coefficient of variation of the values. */
  | { type: "regularity" }
  /** Circular SD, in minutes, of the entries' times of day. */
  | { type: "timeSpread" }
  /** The sum of the entries matching `part`, out of the sum of all of them (0…1). */
  | { type: "share"; part: Filter };

export type Transform =
  /** Divides by another metric over the same bucket; a zero denominator is unknown. */
  | { type: "ratio"; denominator: MetricDefinition }
  /** Divides by the bucket's mean trend weight (kg per day, from E4). */
  | { type: "perKg"; weightKg: ReadonlyMap<IsoDate, string | number> };

export type MetricDefinition = {
  /** An entry kind's field (the field is ignored by count and timeSpread), or a per-day metric. */
  source: { kind: string; field?: string } | { metric: MetricDefinition };
  filter?: Filter | undefined;
  aggregate: Aggregate;
  /** One value per day, ISO week or month, or one for the whole window. */
  per: "day" | "week" | "month" | "window";
  transform?: Transform;
};

export type MetricPoint = { window: Window; value: Over<string> };

const UNKNOWN: Over<string> = { known: false };

/**
 * The metric over `w`: one point per bucket, in order (a single point when `per` is "window").
 * Week and month buckets are clipped to `w`, and `days`/`of` count the clipped days.
 */
export function metric(
  entries: readonly MetricEntry[],
  def: MetricDefinition,
  w: Window,
): MetricPoint[] {
  const points = buckets(w, def.per).map((b) => ({
    window: b,
    value: bucketValue(entries, def, b),
  }));
  const t = def.transform;
  if (!t) return points;
  if (t.type === "ratio") {
    const den = metric(entries, { ...t.denominator, per: def.per }, w);
    return points.map((p, i) => ({ ...p, value: divide(p.value, den[i]!.value) }));
  }
  return points.map((p) => {
    const kg = daysOf(p.window).flatMap((d) =>
      t.weightKg.has(d) ? [t.weightKg.get(d)!] : [],
    );
    if (kg.length === 0) return { ...p, value: UNKNOWN };
    const mean = kg.reduce<Big>((a, v) => a.plus(v), new Big(0)).div(kg.length);
    return { ...p, value: divide(p.value, known(mean.toString())) };
  });
}

function buckets(w: Window, per: MetricDefinition["per"]): Window[] {
  if (per === "window") return [w];
  if (per === "day") return daysOf(w).map((d) => ({ from: d, to: d }));
  const out: Window[] = [];
  for (const d of daysOf(w)) {
    const b = per === "week" ? isoWeek(d) : month(d);
    const clipped = {
      from: b.from < w.from ? w.from : b.from,
      to: b.to > w.to ? w.to : b.to,
    };
    if (out.at(-1)?.from !== clipped.from) out.push(clipped);
  }
  return out;
}

export function bucketValue(
  entries: readonly MetricEntry[],
  def: Pick<MetricDefinition, "source" | "filter" | "aggregate">,
  b: Window,
): Over<string> {
  if ("metric" in def.source) {
    if (def.source.metric.per !== "day")
      throw new RangeError("a metric of a metric reads a per-day metric");
    const byDay = new Map<IsoDate, Item>();
    for (const p of metric(entries, def.source.metric, b))
      if (p.value.known)
        byDay.set(p.window.from, { value: p.value.value, day: p.window.from });
    return fold(b, groupOf(byDay), def.aggregate);
  }
  const { kind, field } = def.source;
  const status = def.filter?.status ?? ["done"];
  const byDay = new Map<IsoDate, Item[]>();
  for (const e of entries) {
    if (
      e.kind !== kind ||
      !contains(b, e.day) ||
      !(status as string[]).includes(e.status)
    )
      continue;
    // The day has data, whatever the other filters keep.
    const items = byDay.get(e.day) ?? [];
    byDay.set(e.day, items);
    if (!matches(e, def.filter)) continue;
    const needsValue =
      def.aggregate.type !== "count" && def.aggregate.type !== "timeSpread";
    const v = field === undefined ? undefined : e.values[field];
    if (needsValue && (typeof v === "boolean" || v === undefined || v === "")) continue;
    items.push({
      value: v === undefined || typeof v === "boolean" ? "0" : String(v),
      day: e.day,
      minute: e.minute,
      entry: e,
    });
  }
  return fold(b, byDay, def.aggregate);
}

/** A value with its place in time; `entry` is absent for a point of a per-day metric. */
type Item = {
  value: string;
  day: IsoDate;
  minute?: number | undefined;
  entry?: MetricEntry;
};

const groupOf = (m: Map<IsoDate, Item>) => new Map([...m].map(([d, i]) => [d, [i]]));

function matches(e: MetricEntry, f: Filter | undefined): boolean {
  if (!f) return true;
  if (f.item !== undefined && e.item !== f.item) return false;
  if (f.tag !== undefined && !(e.tags ?? []).includes(f.tag)) return false;
  if (f.minutes) {
    if (e.minute === undefined) return false;
    const { from, to } = f.minutes;
    const inside =
      from <= to
        ? e.minute >= from && e.minute <= to
        : e.minute >= from || e.minute <= to;
    if (!inside) return false;
  }
  return true;
}

function fold(b: Window, byDay: Map<IsoDate, Item[]>, agg: Aggregate): Over<string> {
  const r = over(b, byDay, (days) => aggregate(days.flat(), agg));
  if (!r.known || r.value === null) return UNKNOWN;
  return { ...r, value: r.value };
}

const sum = (xs: readonly Item[]) =>
  xs.reduce<Big>((a, x) => a.plus(x.value), new Big(0));

/** Null when the value cannot be computed from what the days hold (a mean of nothing, a share of 0). */
function aggregate(items: Item[], agg: Aggregate): string | null {
  switch (agg.type) {
    case "count":
      return String(items.length);
    case "sum":
      return sum(items).toString();
    case "mean":
      return items.length === 0 ? null : sum(items).div(items.length).toString();
    case "min":
    case "max": {
      if (items.length === 0) return null;
      const pick = (a: Big, b: Big) =>
        agg.type === "min" ? (b.lt(a) ? b : a) : b.gt(a) ? b : a;
      return items
        .map((x) => new Big(x.value))
        .reduce(pick)
        .toString();
    }
    case "first":
    case "last": {
      if (items.length === 0) return null;
      const sorted = [...items].sort(byTime);
      return (agg.type === "first" ? sorted[0]! : sorted[sorted.length - 1]!).value;
    }
    case "regularity": {
      const r = regularity(items.map((x) => Number(x.value)));
      return r === null ? null : String(r);
    }
    case "timeSpread": {
      const t = circularTime(
        items.flatMap((x) => (x.minute === undefined ? [] : [x.minute])),
      );
      return t === null ? null : String(t.sdMin);
    }
    case "share": {
      const all = sum(items);
      if (all.eq(0)) return null;
      return sum(items.filter((x) => x.entry && matches(x.entry, agg.part)))
        .div(all)
        .toString();
    }
  }
}

/** Day, then time (an unknown time sits at the end of its day), then input order. */
function byTime(a: Item, b: Item): number {
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
  return (a.minute ?? Infinity) - (b.minute ?? Infinity) || 0;
}

const known = (value: string): Over<string> => ({ known: true, value, days: 1, of: 1 });

function divide(n: Over<string>, d: Over<string>): Over<string> {
  if (!n.known || !d.known || new Big(d.value).eq(0)) return UNKNOWN;
  return { ...n, value: new Big(n.value).div(d.value).toString() };
}
