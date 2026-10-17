/**
 * Loads a v2 file into a database for an owner (the v2 replace's core,
 * ADR-0052's contract). Tables go in dependency order (`V2_TABLES`); inside a
 * table that points at itself (items, entries, blocks) parents go before
 * their children. Every row gets the owner; ISO strings become timestamps.
 * One transaction: a file that breaks a rule of the schema loads nothing.
 */
import { getTableColumns } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { V2File, V2TableKey } from "./file";
import { V2_TABLES } from "./file";

const SELF: Partial<Record<V2TableKey, string[]>> = {
  catalog_items: ["parentId", "basedOnId"],
  entries: ["parentId"],
  template_blocks: ["anchorBlockId", "baseBlockId"],
  templates: ["extendsId"],
};
const CHUNK = 500;

/** Parents before children, for a table whose rows point at rows of the same table. */
export function parentsFirst<T extends Record<string, unknown>>(
  rows: readonly T[],
  refs: readonly string[],
): T[] {
  const byId = new Map(rows.map((r) => [String(r["id"]), r]));
  const done = new Set<string>();
  const out: T[] = [];
  const visit = (r: T, path: Set<string>) => {
    const id = String(r["id"]);
    if (done.has(id)) return;
    if (path.has(id)) throw new Error(`a loop of references through ${id}`);
    path.add(id);
    for (const k of refs) {
      const p = r[k];
      if (typeof p === "string" && byId.has(p)) visit(byId.get(p)!, path);
    }
    path.delete(id);
    done.add(id);
    out.push(r);
  };
  for (const r of rows) visit(r, new Set());
  return out;
}

export async function loadFile(
  db: PgDatabase<PgQueryResultHKT, Record<string, unknown>>,
  file: V2File,
  userId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const key of Object.keys(V2_TABLES) as V2TableKey[]) {
      const table = V2_TABLES[key];
      const columns = getTableColumns(table);
      const dates = Object.entries(columns)
        .filter(([, c]) => c.columnType === "PgTimestamp")
        .map(([k]) => k);
      let rows = file.tables[key] as Record<string, unknown>[];
      const self = SELF[key];
      if (self) rows = parentsFirst(rows, self);
      const ready = rows.map((r) => {
        const row: Record<string, unknown> = { ...r, userId };
        for (const d of dates)
          if (typeof row[d] === "string") row[d] = new Date(row[d] as string);
        return row;
      });
      for (let i = 0; i < ready.length; i += CHUNK)
        await tx
          .insert(table)
          .values(ready.slice(i, i + CHUNK) as (typeof table)["$inferInsert"][]);
    }
  });
}
