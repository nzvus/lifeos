/**
 * core/account/export.ts — everything the owner has, as JSON (V-14 «Esporta»):
 * every table that holds the owner's rows, each read ownedBy; the auth
 * tables (password hashes, sessions) are left out. A copy to keep, not yet a
 * file the app reads back.
 */
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";

const TABLES = {
  settings: s.settings,
  kinds: s.kinds,
  catalog_items: s.catalogItems,
  catalog_values: s.catalogValues,
  catalog_parts: s.catalogParts,
  price_observations: s.priceObservations,
  entries: s.entries,
  entry_values: s.entryValues,
  entry_lines: s.entryLines,
  entry_line_values: s.entryLineValues,
  entry_links: s.entryLinks,
  training_sets: s.trainingSets,
  receipts: s.receipts,
  money_movements: s.moneyMovements,
  money_lines: s.moneyLines,
  receipt_aliases: s.receiptAliases,
  templates: s.templates,
  template_blocks: s.templateBlocks,
  cycle_steps: s.cycleSteps,
  cycle_step_items: s.cycleStepItems,
  cycles_state: s.cyclesState,
  week_layouts: s.weekLayouts,
  goals: s.goals,
  decisions: s.decisions,
} as const;

export type Export = {
  format: "lifeos-v2-export";
  version: 1;
  exportedAt: string;
  tables: Record<keyof typeof TABLES, unknown[]>;
};

export async function exportAll(db: Db, owner: Owner, now: Date): Promise<Export> {
  const names = Object.keys(TABLES) as (keyof typeof TABLES)[];
  const rows = await Promise.all(
    names.map((n) => {
      const t = TABLES[n];
      return db.select().from(t).where(ownedBy(t, owner));
    }),
  );
  return {
    format: "lifeos-v2-export",
    version: 1,
    exportedAt: now.toISOString(),
    tables: Object.fromEntries(names.map((n, i) => [n, rows[i]!])) as Export["tables"],
  };
}
