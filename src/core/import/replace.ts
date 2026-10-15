/**
 * core/import/replace.ts — REPLACES all of one account's data with an export
 * file (ADR-0052 A). Any version: 21 as it is, 1–20 through ./legacy.ts.
 *
 * Destructive by design, so:
 *   - `readExport` validates the whole file first (shape, columns, every
 *     reference); an invalid file never reaches the database.
 *   - `planReplace` is the dry run: per table, rows now and after; which
 *     tables an older file lacks and are kept; which are lost with it.
 *   - `replaceAll` is ONE transaction: the old data goes and the file's
 *     comes, or neither. A constraint the file breaks rolls everything back.
 *   - Only the owner's rows are touched (`ownedBy`); the account itself
 *     (login, email) is kept, and so are the language and the assistant's
 *     key from Settings (the key never travels).
 *   - Every row gets a new id and references follow it, so a file from
 *     another account (or this one, still in place) never collides.
 *
 * What a table absent from an older file means: kept as it is — unless it
 * hangs off a replaced table (a cascade or restrict reference), as caffeine
 * and creatine amounts hang off ingredients: those rows would point at
 * nothing, so they go too, and the plan names them as `lost`.
 *
 * Tested in replace.test.ts (export → replace → export round trip, every
 * table) and legacy.test.ts.
 */
import { randomUUID } from "node:crypto";
import { count, getTableColumns } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { Db } from "../db/client";
import { userSettings } from "../db/schema";
import { EXPORT_FORMAT, EXPORT_VERSION, type Row } from "../export/export";
import { EXPORT_TABLE, EXPORT_TABLES, type TableSpec } from "../export/tables";
import { ownedBy, type Owner } from "../identity/owner";
import { DEFAULT_LOCALE } from "../shared/locales";
import { legacyTables } from "./legacy";

export type ImportProblem =
  | { code: "not_export" }
  | { code: "newer_version"; version: number }
  | { code: "unknown_table"; table: string }
  | { code: "missing_table"; table: string }
  | { code: "not_rows"; table: string }
  | { code: "unknown_column"; table: string; column: string }
  | { code: "invalid_number"; table: string; row: number; column: string }
  | { code: "missing_id"; table: string; row: number }
  | { code: "duplicate_id"; table: string; row: number }
  | { code: "dangling_ref"; table: string; row: number; column: string; target: string }
  | { code: "rejected"; detail: string };

export type ImportFile = {
  version: number;
  exportedAt: string | null;
  /** Only the tables the file has (an older version lacks some). */
  tables: Map<string, Row[]>;
  /** `table.column` an older version had and this one doesn't: ignored. */
  dropped: string[];
  /**
   * Versions ≤ 20 left the trash out, yet live rows still pointed into it
   * (an entry logged from a meal since deleted). Those links are treated as
   * the database treats a deleted parent: cleared, or the row goes with it.
   */
  repaired: Repair[];
};

export type Repair = {
  table: string;
  column: string;
  target: string;
  action: "unlinked" | "removed";
  rows: number;
};

type Read = { ok: true; file: ImportFile } | { ok: false; problems: ImportProblem[] };

const MAX_PROBLEMS = 20;

/**
 * Settings that stay the account's own on a replace (ADR-0052). An account
 * that never saved settings has no row: it keeps what it shows, the defaults.
 */
const KEPT_SETTINGS: Row = {
  locale: DEFAULT_LOCALE,
  assistantKeyEnc: null,
  assistantKeyLast4: null,
  assistantModel: "openrouter/free",
};

export function readExport(raw: unknown): Read {
  const file = raw as Record<string, unknown> | null;
  if (!file || typeof file !== "object" || file.format !== EXPORT_FORMAT)
    return { ok: false, problems: [{ code: "not_export" }] };
  const version = Number(file.version);
  if (!Number.isInteger(version) || version < 1)
    return { ok: false, problems: [{ code: "not_export" }] };
  if (version > EXPORT_VERSION)
    return { ok: false, problems: [{ code: "newer_version", version }] };

  const legacy = version < 21;
  const problems: ImportProblem[] = [];
  const tables = new Map<string, Row[]>();
  const dropped = new Set<string>();
  const source: Record<string, unknown> = legacy
    ? legacyTables(file)
    : ((file.tables as Record<string, unknown> | undefined) ?? {});

  for (const [key, rows] of Object.entries(source)) {
    const spec = EXPORT_TABLE.get(key);
    if (!spec) {
      problems.push({ code: "unknown_table", table: key });
      continue;
    }
    if (!Array.isArray(rows) || rows.some((r) => !r || typeof r !== "object")) {
      problems.push({ code: "not_rows", table: key });
      continue;
    }
    const columns = getTableColumns(spec.table);
    const clean: Row[] = [];
    (rows as Row[]).forEach((row, index) => {
      const kept: Row = {};
      for (const [column, value] of Object.entries(row)) {
        if (column === "userId") continue;
        const c = columns[column];
        if (!c || spec.omit.includes(column)) {
          if (legacy) dropped.add(`${key}.${column}`);
          else problems.push({ code: "unknown_column", table: key, column });
          continue;
        }
        if (!exactDecimal(c, value))
          problems.push({ code: "invalid_number", table: key, row: index, column });
        kept[column] = value;
      }
      clean.push(kept);
    });
    tables.set(key, clean);
  }
  if (!legacy)
    for (const spec of EXPORT_TABLES)
      if (!(spec.key in source))
        problems.push({ code: "missing_table", table: spec.key });

  const repaired = legacy ? repairTrashLinks(tables) : [];
  problems.push(...checkReferences(tables));
  if (problems.length) return { ok: false, problems: problems.slice(0, MAX_PROBLEMS) };
  return {
    ok: true,
    file: {
      version,
      exportedAt: typeof file.exportedAt === "string" ? file.exportedAt : null,
      tables,
      dropped: [...dropped].sort(),
      repaired,
    },
  };
}

/**
 * A decimal column's value has no more decimals than the column keeps:
 * Postgres would round it silently (PROJECT.md's primary invariant). The
 * app's own exports always pass; a file edited by hand may not.
 */
function exactDecimal(column: PgColumn, value: unknown): boolean {
  if (column.columnType !== "PgNumeric" || value === null || value === undefined)
    return true;
  const scale = (column as PgColumn & { scale?: number }).scale ?? 0;
  return (
    typeof value === "string" && new RegExp(`^-?\\d+(\\.\\d{1,${scale}})?$`).test(value)
  );
}

/** See `ImportFile.repaired`. Repeats until stable: a removed row's children follow. */
function repairTrashLinks(tables: Map<string, Row[]>): Repair[] {
  const repairs = new Map<string, Repair>();
  for (let changed = true; changed;) {
    changed = false;
    const ids = new Map<string, Set<unknown>>();
    for (const [key, rows] of tables) {
      const id = EXPORT_TABLE.get(key)!.idColumn;
      if (id) ids.set(key, new Set(rows.map((r) => r[id])));
    }
    for (const [key, rows] of tables) {
      const spec = EXPORT_TABLE.get(key)!;
      const keep: Row[] = [];
      for (const row of rows) {
        let removed = false;
        for (const ref of spec.refs) {
          const value = row[ref.column];
          const known = ids.get(ref.table);
          if (value === null || value === undefined || !known || known.has(value))
            continue;
          if (ref.onDelete !== "set null" && ref.onDelete !== "cascade") continue; // stays a problem
          const action = ref.onDelete === "set null" ? "unlinked" : "removed";
          const k = `${key}.${ref.column}`;
          const r = repairs.get(k) ?? {
            table: key,
            column: ref.column,
            target: ref.table,
            action,
            rows: 0,
          };
          r.rows++;
          repairs.set(k, r);
          if (action === "unlinked") row[ref.column] = null;
          else removed = true;
          changed = true;
        }
        if (!removed) keep.push(row);
      }
      tables.set(key, keep);
    }
  }
  return [...repairs.values()];
}

/** Every id is there once; every reference points at a row of the file. */
function checkReferences(tables: Map<string, Row[]>): ImportProblem[] {
  const problems: ImportProblem[] = [];
  const ids = new Map<string, Set<unknown>>();
  for (const [key, rows] of tables) {
    const spec = EXPORT_TABLE.get(key)!;
    if (!spec.idColumn) continue;
    const seen = new Set<unknown>();
    rows.forEach((r, row) => {
      const id = r[spec.idColumn!];
      if (id === undefined || id === null)
        problems.push({ code: "missing_id", table: key, row });
      else if (seen.has(id)) problems.push({ code: "duplicate_id", table: key, row });
      seen.add(id);
    });
    ids.set(key, seen);
  }
  for (const [key, rows] of tables) {
    const spec = EXPORT_TABLE.get(key)!;
    rows.forEach((r, row) => {
      for (const ref of spec.refs) {
        const value = r[ref.column];
        if (value === null || value === undefined) continue;
        if (!ids.get(ref.table)?.has(value))
          problems.push({
            code: "dangling_ref",
            table: key,
            row,
            column: ref.column,
            target: ref.table,
          });
      }
    });
  }
  return problems;
}

export type ReplacePlan = {
  version: number;
  exportedAt: string | null;
  /** Tables the file holds: their rows now and after. */
  replaced: { table: string; now: number; after: number }[];
  /** Tables the file lacks that go anyway (they hang off a replaced one). */
  lost: { table: string; now: number }[];
  /** Tables the file lacks, kept as they are. */
  kept: string[];
  dropped: string[];
  repaired: Repair[];
};

/** Tables the file lacks whose rows would point at nothing once it is in. */
function lostTables(present: Set<string>): Set<string> {
  const gone = new Set(present);
  const lost = new Set<string>();
  for (let changed = true; changed;) {
    changed = false;
    for (const spec of EXPORT_TABLES) {
      if (gone.has(spec.key)) continue;
      const hangs = spec.parents.some(
        (p) => gone.has(p.table) && p.onDelete !== "set null",
      );
      if (hangs) {
        gone.add(spec.key);
        lost.add(spec.key);
        changed = true;
      }
    }
  }
  return lost;
}

async function countRows(db: Db, owner: Owner, spec: TableSpec): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(spec.table)
    .where(ownedBy(spec.table, owner));
  return r!.n;
}

/** The dry run: what the replace would do, nothing written. */
export async function planReplace(
  db: Db,
  owner: Owner,
  file: ImportFile,
): Promise<ReplacePlan> {
  const present = new Set(file.tables.keys());
  const lost = lostTables(present);
  const now = new Map(
    await Promise.all(
      EXPORT_TABLES.map(async (s) => [s.key, await countRows(db, owner, s)] as const),
    ),
  );
  return {
    version: file.version,
    exportedAt: file.exportedAt,
    replaced: EXPORT_TABLES.filter((s) => present.has(s.key)).map((s) => ({
      table: s.key,
      now: now.get(s.key)!,
      after: file.tables.get(s.key)!.length,
    })),
    lost: EXPORT_TABLES.filter((s) => lost.has(s.key)).map((s) => ({
      table: s.key,
      now: now.get(s.key)!,
    })),
    kept: EXPORT_TABLES.filter((s) => !present.has(s.key) && !lost.has(s.key)).map(
      (s) => s.key,
    ),
    dropped: file.dropped,
    repaired: file.repaired,
  };
}

/** Parents before children inside one table (a category's parent first). */
function selfOrdered(spec: TableSpec, rows: Row[]): Row[] {
  const self = spec.refs.find((r) => r.table === spec.key);
  if (!self) return rows;
  const byId = new Map(rows.map((r) => [r[spec.idColumn!], r]));
  const out: Row[] = [];
  const done = new Set<Row>();
  const visit = (r: Row) => {
    if (done.has(r)) return;
    done.add(r);
    const parent = byId.get(r[self.column]);
    if (parent) visit(parent);
    out.push(r);
  };
  rows.forEach(visit);
  return out;
}

const CHUNK = 200;

export async function replaceAll(
  db: Db,
  owner: Owner,
  file: ImportFile,
): Promise<{ ok: true; plan: ReplacePlan } | { ok: false; problems: ImportProblem[] }> {
  const plan = await planReplace(db, owner, file);
  const present = new Set(file.tables.keys());
  const goes = new Set([...present, ...plan.lost.map((l) => l.table)]);
  try {
    await db.transaction(async (tx) => {
      const [mine] = await tx
        .select()
        .from(userSettings)
        .where(ownedBy(userSettings, owner));

      for (const spec of [...EXPORT_TABLES].reverse())
        if (goes.has(spec.key))
          await tx.delete(spec.table).where(ownedBy(spec.table, owner));

      const newIds = new Map<string, Map<unknown, string>>();
      for (const spec of EXPORT_TABLES) {
        const rows = file.tables.get(spec.key);
        if (!rows) continue;
        const ids = new Map<unknown, string>();
        newIds.set(spec.key, ids);
        if (spec.idColumn) for (const r of rows) ids.set(r[spec.idColumn], randomUUID());
        const values = selfOrdered(spec, rows).map((r) => {
          const v: Row = { ...r, userId: owner.id };
          if (spec.idColumn) v[spec.idColumn] = ids.get(r[spec.idColumn]);
          for (const ref of spec.refs)
            if (v[ref.column] != null)
              v[ref.column] = newIds.get(ref.table)!.get(v[ref.column]);
          for (const c of spec.dateColumns)
            if (typeof v[c] === "string") v[c] = new Date(v[c] as string);
          if (spec.key === "user_settings")
            for (const [k, fallback] of Object.entries(KEPT_SETTINGS))
              v[k] = mine ? (mine as Row)[k] : fallback;
          return v;
        });
        // A self-reference must find its parent already in: one row at a time.
        const step = spec.refs.some((r) => r.table === spec.key) ? 1 : CHUNK;
        for (let i = 0; i < values.length; i += step)
          await tx.insert(spec.table).values(values.slice(i, i + step) as never);
      }
    });
  } catch (e) {
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause : e;
    const detail =
      (cause as { constraint?: string }).constraint ??
      (cause instanceof Error ? cause.message : String(cause));
    return { ok: false, problems: [{ code: "rejected", detail }] };
  }
  return { ok: true, plan };
}
