/**
 * core/export/export.ts — "give me all my data" (PROJECT.md v1 §5, ADR-0003,
 * ADR-0052).
 *
 * ADR-0003 calls the user-facing export "the human-readable half of
 * durability": the pg_dump backup protects against losing the database; this
 * export protects against losing the ACCOUNT or the whole service, because
 * it is a plain JSON file you keep yourself, readable without this app.
 *
 * Design (version 21, ADR-0052):
 *   - Every table the account owns, as stored, one section per table
 *     (`tables.<sql name>`), walked from ./tables.ts — nothing hand-listed,
 *     so nothing is forgotten. The trash is included (rows with `deletedAt`).
 *   - Rows keep their ids: references inside the file follow them. An
 *     import renews them (core/import/replace.ts).
 *   - Only the owner's rows (`ownedBy`, tested); no secrets (password,
 *     sessions, the assistant's key — ./tables.ts EXCLUDED / OMIT).
 *   - Values as stored (exact decimal strings, integer cents), not rounded
 *     display values: an export is data, not a report.
 *
 * Versions 1–20 nested records in their parents (a meal's items inside the
 * meal); core/import/legacy.ts still reads them.
 *
 * Called by: src/app/api/export/route.ts. Tested in export.test.ts.
 */
import { asc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { user } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { EXPORT_TABLES } from "./tables";

export const EXPORT_FORMAT = "lifeos-export";
// 1–20: nested sections (see core/import/legacy.ts for their history).
// 21: every owned table, flat, trash included (ADR-0052).
export const EXPORT_VERSION = 21;

export type Row = Record<string, unknown>;

export type UserExport = {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  account: { name: string; email: string; createdAt: Date } | null;
  tables: Record<string, Row[]>;
};

export async function exportUserData(
  db: Db,
  owner: Owner,
  now: Date = new Date(),
): Promise<UserExport> {
  // `user` has no user_id column (it IS the user), so filter by its id.
  const [me] = await db
    .select({ name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, owner.id));

  const sections = await Promise.all(
    EXPORT_TABLES.map(async (spec) => {
      const columns = spec.table as unknown as Record<string, never>;
      const rows: Row[] = await db
        .select()
        .from(spec.table)
        .where(ownedBy(spec.table, owner))
        .orderBy(...spec.primaryKey.map((p) => asc(columns[p]!)));
      const drop = new Set(["userId", ...spec.omit]);
      return [
        spec.key,
        rows.map((r) =>
          Object.fromEntries(Object.entries(r).filter(([k]) => !drop.has(k))),
        ),
      ] as const;
    }),
  );

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    account: me ?? null,
    tables: Object.fromEntries(sections),
  };
}
