/**
 * Loads a v2 file into a database for an owner (the v2 replace's core,
 * ADR-0052's contract). Tables go in dependency order (`V2_TABLES`); inside a
 * table that points at itself (items, entries, blocks) parents go before
 * their children. Every row gets the owner; ISO strings become timestamps.
 * One transaction: a file that breaks a rule of the schema loads nothing.
 * `replaceFile` first takes out every row the owner has in those tables
 * (never the account and sign-in tables), in the same transaction: if the
 * load fails, what was there stays.
 */
import { eq, getTableColumns, getTableName, sql, type Column } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT, PgTable } from "drizzle-orm/pg-core";
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

type AnyDb = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;
type Tx = Parameters<Parameters<AnyDb["transaction"]>[0]>[0];

export async function loadFile(db: AnyDb, file: V2File, userId: string): Promise<void> {
  await db.transaction((tx) => insertAll(tx, file, userId));
}

/** The owner's rows in the v2 tables taken out, then the file loaded: one transaction. */
export async function replaceFile(
  db: AnyDb,
  file: V2File,
  userId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const key of (Object.keys(V2_TABLES) as V2TableKey[]).reverse()) {
      const table = V2_TABLES[key] as PgTable & { userId: Column };
      const refs = SELF[key];
      if (!refs) {
        await tx.delete(table).where(eq(table.userId, userId));
        continue;
      }
      // A table pointing at itself: the rows nothing points at first, until none is left
      // (unhooking the references instead would break the live-name index).
      const name = sql.identifier(getTableName(table));
      const cols = getTableColumns(table);
      const pointed = sql.join(
        refs.map((r) => sql`c.${sql.identifier(cols[r]!.name)} = t.id`),
        sql` or `,
      );
      for (;;) {
        const gone = await tx.execute(
          sql`delete from ${name} t where t.user_id = ${userId} and not exists (
            select 1 from ${name} c where c.user_id = ${userId} and (${pointed}))
            returning t.id`,
        );
        const n = Array.isArray(gone)
          ? gone.length
          : ((gone as { rows?: unknown[] }).rows?.length ?? 0);
        if (n === 0) break;
      }
    }
    await insertAll(tx, file, userId);
  });
}

async function insertAll(tx: Tx, file: V2File, userId: string): Promise<void> {
  {
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
  }
}
