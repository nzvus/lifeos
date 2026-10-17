/**
 * What the converter reads (a v1 export, version 21, and the refined copy's
 * layers) and the place it writes into (the v2 tables and the report).
 */
import Big from "big.js";
import type { Dropped, RowOf, V2TableKey, V2Tables } from "./file";
import { emptyTables } from "./file";
import { idFor } from "./ids";

export type V1Row = Record<string, unknown>;

/** The refined copy's v2 layer (food › product › format, ADR-0055), when present. */
export type RefinedV2 = {
  foods: {
    id: string;
    name: string;
    group: string;
    from: string[];
    valuesFrom: string;
    archived: boolean;
  }[];
  products: { id: string; food: string; brand: string; label: string; from: string[] }[];
  formats: {
    id: string;
    product: string;
    name: string;
    size: number | null;
    unit: string;
    barcode: string | null;
    from: string;
    shape: boolean;
    ownValues: string | null;
  }[];
  price_observations: {
    format: string;
    /** Null when the receipt or description did not say. */
    shop: string | null;
    day: string;
    cents: number;
    qty: number;
    unit: string;
    source: string;
  }[];
  pointers: {
    log_entry_items?: Record<
      string,
      { food: string; product?: string | null; format?: string | null }
    >;
    meal_items?: Record<string, { food: string; preferredProduct?: string | null }>;
    batch_lines?: Record<
      string,
      { food: string; product?: string | null; format?: string | null }
    >;
    /** A log entry's meal after a merge. */
    log_entries?: Record<string, string>;
  };
  goals: {
    id: string;
    what: string;
    target: number;
    unit: string;
    per: string;
    days?: string;
    source: string;
  }[];
  meal_merges: { keep: string; merged: string[]; name: string; why: string }[];
};

export type Provenance = {
  source?: string;
  confidence?: string;
  estimate?: boolean;
  basis?: string;
};
export type Estimates = {
  ingredients?: Record<string, Record<string, unknown> & { provenance?: Provenance }>;
  exercises?: Record<string, Record<string, unknown> & { provenance?: Provenance }>;
  day_activity?: Record<string, { steps?: number; provenance?: Provenance }>;
  meals?: Record<string, Record<string, unknown> & { provenance?: Provenance }>;
};

export type V1Export = {
  format: string;
  version: number;
  exportedAt: string;
  account: { name: string; email: string; createdAt: string } | null;
  tables: Record<string, V1Row[] | undefined>;
  _v2?: RefinedV2;
  _estimates?: Estimates;
};

/** An estimate's confidence in words (the refined copy) as 0–1. */
export function confidenceOf(p: Provenance | undefined): string {
  return p?.confidence === "alta" ? "0.80" : p?.confidence === "media" ? "0.60" : "0.30";
}

/** A v1 number (numeric columns come as strings) as an exact decimal string; null when absent. */
export function dec(x: unknown): string | null {
  if (x === null || x === undefined || x === "") return null;
  if (typeof x !== "number" && typeof x !== "string") return null;
  try {
    return new Big(x).toString();
  } catch {
    return null;
  }
}

export const str = (x: unknown): string | null =>
  typeof x === "string" && x !== "" ? x : null;
export const iso = (x: unknown): string | null =>
  typeof x === "string" && x !== "" ? x : null;
export const intOf = (x: unknown): number | null => {
  const d = dec(x);
  return d === null ? null : Math.round(Number(d));
};

type Val = { num: string } | { text: string } | { bool: boolean } | { ref: string };
type Meta = { source?: string; confidence?: string };

export class Out {
  readonly tables: V2Tables = emptyTables();
  readonly dropped: Dropped[] = [];
  estimates = 0;
  readonly notes: string[] = [];
  /** Keys already written, so a value is never written twice (the first source wins). */
  private readonly seen = new Set<string>();

  push<K extends V2TableKey>(table: K, row: RowOf<K>): void {
    (this.tables[table] as RowOf<K>[]).push(row);
  }

  drop(table: string, rows: number, why: string): void {
    if (rows > 0) this.dropped.push({ table, rows, why });
  }

  /** A catalog value; null values are skipped. Returns whether it was written. */
  itemValue(itemId: string, field: string, v: Val | null, meta: Meta = {}): boolean {
    if (v === null) return false;
    const key = `i|${itemId}|${field}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    this.push("catalog_values", {
      itemId,
      field,
      num: "num" in v ? v.num : null,
      text: "text" in v ? v.text : null,
      bool: "bool" in v ? v.bool : null,
      refItemId: "ref" in v ? v.ref : null,
      unit: null,
      source: meta.source ?? "v1",
      confidence: meta.confidence ?? "1",
    });
    return true;
  }

  entryValue(entryId: string, field: string, v: Val | null): void {
    if (v === null) return;
    const key = `e|${entryId}|${field}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.push("entry_values", {
      entryId,
      field,
      num: "num" in v ? v.num : null,
      text: "text" in v ? v.text : null,
      bool: "bool" in v ? v.bool : null,
      refItemId: "ref" in v ? v.ref : null,
    });
  }
}

export const num = (x: unknown): Val | null => {
  const d = dec(x);
  return d === null ? null : { num: d };
};
export const text = (x: unknown): Val | null => {
  const t = str(x);
  return t === null ? null : { text: t };
};
export const bool = (x: unknown): Val | null =>
  typeof x === "boolean" ? { bool: x } : null;
export const ref = (x: string | null | undefined): Val | null => (x ? { ref: x } : null);

export { idFor };
