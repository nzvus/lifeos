/**
 * core/convert/sessions.ts — the training logged in v1 after v2 was loaded
 * (the cutover decided 2026-10-17: food and the day in v2, gym in v1 until
 * gym mode was in v2). From a newer v1 export, converted whole, it keeps
 * only the sessions from `since` on that v2 does not have yet, with their
 * exercises, values and sets, and the exercises and routines they name that
 * v2's catalog lacks (with their values, and a new routine's parts and the
 * exercises those name). Ids are v1's, so a session already in v2 is never
 * loaded twice. Pure: the loader writes what it returns.
 */
import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { catalogItems, entries } from "../db/schema";
import type { IsoDate } from "../engines/time";
import { emptyTables, type V2File } from "./file";

export type Existing = { entryIds: ReadonlySet<string>; itemIds: ReadonlySet<string> };

export function sessionsSince(file: V2File, since: IsoDate, have: Existing): V2File {
  const t = file.tables;
  const out = emptyTables();
  const sessions = t.entries.filter(
    (e) => e.kind === "session" && e.day >= since && !have.entryIds.has(String(e.id)),
  );
  const sessionIds = new Set(sessions.map((e) => String(e.id)));
  const children = t.entries.filter(
    (e) => e.kind === "session_exercise" && sessionIds.has(String(e.parentId)),
  );
  out.entries = [...sessions, ...children];
  const entryIds = new Set(out.entries.map((e) => String(e.id)));
  out.entry_values = t.entry_values.filter((v) => entryIds.has(String(v.entryId)));
  out.training_sets = t.training_sets.filter((s) => entryIds.has(String(s.entryId)));

  // The catalog items they name that v2 lacks: routines, their parts' exercises, exercises.
  const items = new Map(t.catalog_items.map((i) => [String(i.id), i]));
  const wanted = new Set<string>();
  const want = (id: unknown) => {
    const k = String(id);
    if (id && items.has(k) && !have.itemIds.has(k)) wanted.add(k);
  };
  for (const e of out.entries) want(e.itemId);
  const newRoutines = [...wanted].filter((id) => items.get(id)!.catalog === "routine");
  out.catalog_parts = t.catalog_parts.filter((p) =>
    newRoutines.includes(String(p.itemId)),
  );
  for (const p of out.catalog_parts) want(p.partItemId);
  out.catalog_items = t.catalog_items.filter((i) => wanted.has(String(i.id)));
  out.catalog_values = t.catalog_values.filter((v) => wanted.has(String(v.itemId)));

  return {
    ...file,
    tables: out,
    report: {
      ...file.report,
      counts: Object.fromEntries(
        Object.entries(out).map(([k, rows]) => [k, rows.length]),
      ) as V2File["report"]["counts"],
    },
  };
}

/** What v2 already holds for this owner: its entries' and catalog items' ids. */
export async function existingIds(
  db: PgDatabase<PgQueryResultHKT, Record<string, unknown>>,
  userId: string,
): Promise<Existing> {
  const [e, i] = await Promise.all([
    db.select({ id: entries.id }).from(entries).where(eq(entries.userId, userId)),
    db
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(eq(catalogItems.userId, userId)),
  ]);
  return { entryIds: new Set(e.map((r) => r.id)), itemIds: new Set(i.map((r) => r.id)) };
}
