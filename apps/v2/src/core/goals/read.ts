/**
 * core/goals/read.ts — the goals in force on a day (a goal changes from a
 * day on: the latest since that day, per metric) and the numbers their
 * progress reads: one field of one kind's done entries, by day.
 */
import { and, eq, gte, isNull, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import { entries, entryValues, goals } from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export type Goal = {
  id: string;
  /** "weight", "weightRatePctWeek", "steps", "study"…: what it measures. */
  source: string;
  metric: Record<string, unknown>;
  target: "at_least" | "at_most" | "range" | "reach";
  value: number | null;
  low: number | null;
  high: number | null;
  by: IsoDate | null;
  since: IsoDate;
};

const num = (x: string | null) => (x === null ? null : Number(x));

export type GoalRow = Goal & { until: IsoDate | null };

/** Pure: per metric, the goal started last on or before `day`, still open. */
export function inForce(all: readonly GoalRow[], day: IsoDate): Goal[] {
  const latest = new Map<string, GoalRow>();
  for (const g of all)
    if (g.since <= day && (latest.get(g.source)?.since ?? "") <= g.since)
      latest.set(g.source, g);
  return [...latest.values()]
    .filter((g) => !g.until || g.until >= day)
    .map(({ until: _until, ...g }) => g);
}

export async function readGoals(db: Db, owner: Owner, day: IsoDate): Promise<Goal[]> {
  const rows = await db.select().from(goals).where(ownedBy(goals, owner));
  return inForce(
    rows.map((r) => {
      const metric = (r.metric ?? {}) as Record<string, unknown>;
      return {
        id: r.id,
        source: typeof metric["source"] === "string" ? metric["source"] : "?",
        metric,
        target: r.target,
        value: num(r.value),
        low: num(r.low),
        high: num(r.high),
        by: r.byDate,
        since: r.sinceDay,
        until: r.untilDay,
      };
    }),
    day,
  );
}

/** One numeric field of a kind's done entries from `from` to `to`, with their day. */
export async function readNumbers(
  db: Db,
  owner: Owner,
  kind: string,
  field: string,
  from: IsoDate,
  to: IsoDate,
): Promise<{ day: IsoDate; n: number }[]> {
  const rows = await db
    .select({ day: entries.day, num: entryValues.num })
    .from(entries)
    .innerJoin(
      entryValues,
      and(eq(entryValues.entryId, entries.id), eq(entryValues.userId, entries.userId)),
    )
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, kind),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        gte(entries.day, from),
        lte(entries.day, to),
        eq(entryValues.field, field),
      ),
    );
  return rows.flatMap((r) => (r.num === null ? [] : [{ day: r.day, n: Number(r.num) }]));
}

/** Minutes of a kind's done intervals whose choice field is `text`, from `from` to `to`. */
export async function readMinutes(
  db: Db,
  owner: Owner,
  kind: string,
  field: string,
  text: string,
  from: IsoDate,
  to: IsoDate,
): Promise<number> {
  const rows = await db
    .select({ startAt: entries.startAt, endAt: entries.endAt })
    .from(entries)
    .innerJoin(
      entryValues,
      and(eq(entryValues.entryId, entries.id), eq(entryValues.userId, entries.userId)),
    )
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, kind),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        gte(entries.day, from),
        lte(entries.day, to),
        eq(entryValues.field, field),
        eq(entryValues.text, text),
      ),
    );
  return rows.reduce(
    (m, r) =>
      r.startAt && r.endAt
        ? m + Math.max(0, (r.endAt.getTime() - r.startAt.getTime()) / 60000)
        : m,
    0,
  );
}
