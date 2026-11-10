/**
 * The v2 export file (schema.md "Export"; v1 ADR-0052's contract): format
 * `lifeos-export`, version 100, every owned table by its SQL name, rows by
 * the schema's property names without `userId` (the importer becomes the
 * owner). Timestamps travel as ISO strings. `V2_TABLES` is in dependency
 * order: parents before children, so a loader can insert in this order.
 */
import * as s from "../db/schema";

export const V2_FORMAT = "lifeos-export";
export const V2_VERSION = 100;

export const V2_TABLES = {
  settings: s.settings,
  kinds: s.kinds,
  catalog_items: s.catalogItems,
  catalog_values: s.catalogValues,
  catalog_parts: s.catalogParts,
  price_observations: s.priceObservations,
  receipts: s.receipts,
  entries: s.entries,
  entry_values: s.entryValues,
  entry_lines: s.entryLines,
  entry_line_values: s.entryLineValues,
  entry_links: s.entryLinks,
  training_sets: s.trainingSets,
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

export type V2TableKey = keyof typeof V2_TABLES;

/** A row as it travels in the file: the insert shape, no owner, dates as strings. */
type Json<T> = {
  [K in keyof T]: Exclude<T[K], Date> | (Date extends T[K] ? string : never);
};
export type RowOf<K extends V2TableKey> = Json<
  Omit<(typeof V2_TABLES)[K]["$inferInsert"], "userId">
>;
export type V2Tables = { [K in V2TableKey]: RowOf<K>[] };

export type Dropped = { table: string; rows: number; why: string };

export type Report = {
  from: { format: string; version: number; exportedAt: string; refined: boolean };
  /** Rows per v2 table. */
  counts: Record<V2TableKey, number>;
  /** v1 rows that have no v2 row, and why (migration.md: "the report listing every row dropped"). */
  dropped: Dropped[];
  /** Values filled by the refined copy's estimate layer (marked by their source and confidence). */
  estimates: number;
  notes: string[];
};

export type V2File = {
  format: typeof V2_FORMAT;
  version: typeof V2_VERSION;
  exportedAt: string;
  account: { name: string; email: string; createdAt: string } | null;
  tables: V2Tables;
  report: Report;
};

/**
 * Each ciclo (a `templates` row of scope cycle) with no catalog «cycle» of the same id gets one,
 * as repair 0006 makes them (MOD-36, PL-72): paused = archived, its rules and start as values.
 */
export function withCycleItems(t: V2Tables, at: string): V2Tables {
  const have = new Set(t.catalog_items.map((r) => r.id));
  const missing = t.templates.filter(
    (r) => r.scope === "cycle" && r.id && !have.has(r.id),
  );
  if (missing.length === 0) return t;
  const rules = new Map(t.cycles_state.map((r) => [r.cycleId, r]));
  const values: RowOf<"catalog_values">[] = missing.flatMap((c) => {
    const r = rules.get(c.id!);
    return (
      [
        ["advance", r?.advance ?? "occurrence"],
        ["onSkip", r?.onSkip ?? "lose"],
        ["start", c.startDay ?? null],
      ] as const
    ).flatMap(([field, text]) => (text ? [{ itemId: c.id!, field, text }] : []));
  });
  return {
    ...t,
    catalog_items: [
      ...t.catalog_items,
      ...missing.map((c) => ({
        id: c.id!,
        catalog: "cycle",
        name: c.name,
        archivedAt: c.active === false && !c.deletedAt ? at : null,
        deletedAt: c.deletedAt ?? null,
        ...(c.createdAt ? { createdAt: c.createdAt } : {}),
      })),
    ],
    catalog_values: [...t.catalog_values, ...values],
  };
}

export function emptyTables(): V2Tables {
  return Object.fromEntries(
    Object.keys(V2_TABLES).map((k) => [k, []]),
  ) as unknown as V2Tables;
}
