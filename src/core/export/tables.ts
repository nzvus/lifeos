/**
 * core/export/tables.ts — every table an account owns, read from the schema
 * itself (ADR-0052). The export, the replace, the merge and the CSV all walk
 * this one list, so a new table is covered the day it is added — or the
 * coverage test (tables.test.ts) fails until it is listed in EXCLUDED.
 *
 * For each table it knows:
 *   - `key`: the SQL name, used as the file's section and the CSV's name;
 *   - `idColumn`: the generated uuid primary key, renewed on import;
 *   - `refs`: columns pointing at another exported table's id, remapped on
 *     import (the owner column is never one: it becomes the importer);
 *   - `dateColumns`: timestamps, which JSON carries as strings;
 *   - `omit`: columns that never leave the server (secrets).
 * `EXPORT_TABLES` is in dependency order: parents before children.
 */
import { getTableColumns, is } from "drizzle-orm";
import { getTableConfig, PgTable, type PgColumn } from "drizzle-orm/pg-core";
import * as schema from "../db/schema";

/** Tables an account has rows in that are NOT exported, and why. */
export const EXCLUDED: Record<string, string> = {
  user: "the account itself: name and email ride in `account`, the login stays",
  session: "login sessions, secrets",
  account: "the password hash, a secret",
  verification: "one-time login tokens, secrets",
  rate_limit: "the server's counters, nobody's data",
  invites: "codes given to other people; restoring one would reopen a sign-up",
};

/** Columns that never leave the server, by table key → column property. */
const OMIT: Record<string, string[]> = {
  // ADR-0018: the assistant's key is encrypted with the server's secret,
  // useless elsewhere; its last four characters are enough to recognise it.
  user_settings: ["assistantKeyEnc"],
};

export type Ref = {
  /** Property name of the referencing column. */
  column: string;
  /** Key of the referenced table (its `idColumn`). */
  table: string;
  /** What deleting the parent does to this row. */
  onDelete: "cascade" | "set null" | "restrict" | "no action";
};

export type TableSpec = {
  key: string;
  table: PgTable & { userId: PgColumn };
  idColumn: string | null;
  refs: Ref[];
  /** Every table this one points at (by id or otherwise), and what deleting it does. */
  parents: { table: string; onDelete: Ref["onDelete"] }[];
  dateColumns: string[];
  omit: string[];
  /** Property names of the primary key, for a stable row order. */
  primaryKey: string[];
};

function specOf(table: PgTable): TableSpec | null {
  const config = getTableConfig(table);
  if (EXCLUDED[config.name] !== undefined) return null;
  const columns = getTableColumns(table);
  const prop = new Map(Object.entries(columns).map(([p, c]) => [c.name, p]));
  if (!prop.has("user_id")) return null;
  const pk = [
    ...config.columns.filter((c) => c.primary).map((c) => c.name),
    ...config.primaryKeys.flatMap((k) => k.columns.map((c) => c.name)),
  ];
  const id = pk.length === 1 && pk[0] === "id" ? "id" : null;
  const refs: Ref[] = [];
  const parents: TableSpec["parents"] = [];
  for (const fk of config.foreignKeys) {
    const r = fk.reference();
    const target = getTableConfig(r.foreignTable).name;
    if (target === "user") continue; // the owner column
    parents.push({
      table: target,
      onDelete: (fk.onDelete ?? "no action") as Ref["onDelete"],
    });
    // A reference is (x) → (id) or (x, user_id) → (id, user_id); only x moves.
    r.columns.forEach((c, i) => {
      if (c.name === "user_id" || r.foreignColumns[i]!.name !== "id") return;
      refs.push({
        column: prop.get(c.name)!,
        table: target,
        onDelete: (fk.onDelete ?? "no action") as Ref["onDelete"],
      });
    });
  }
  return {
    key: config.name,
    table: table as TableSpec["table"],
    idColumn: id,
    refs,
    parents,
    dateColumns: Object.entries(columns)
      .filter(([, c]) => c.dataType === "date")
      .map(([p]) => p),
    omit: OMIT[config.name] ?? [],
    primaryKey: pk.map((n) => prop.get(n)!),
  };
}

/** Parents first; a table's own self-reference (a category's parent) is not an edge. */
function dependencyOrder(specs: TableSpec[]): TableSpec[] {
  const byKey = new Map(specs.map((s) => [s.key, s]));
  const done = new Set<string>();
  const out: TableSpec[] = [];
  const visit = (s: TableSpec) => {
    if (done.has(s.key)) return;
    done.add(s.key);
    for (const p of s.parents) if (p.table !== s.key) visit(byKey.get(p.table)!);
    out.push(s);
  };
  [...specs].sort((a, b) => a.key.localeCompare(b.key)).forEach(visit);
  return out;
}

/** Every PgTable in the schema, by SQL name. */
export const SCHEMA_TABLES: Map<string, PgTable> = new Map(
  (Object.values(schema) as unknown[])
    .filter((t): t is PgTable => is(t, PgTable))
    .map((t) => [getTableConfig(t).name, t]),
);

export const EXPORT_TABLES: TableSpec[] = dependencyOrder(
  [...SCHEMA_TABLES.values()].map(specOf).filter((s): s is TableSpec => s !== null),
);

export const EXPORT_TABLE: Map<string, TableSpec> = new Map(
  EXPORT_TABLES.map((s) => [s.key, s]),
);
