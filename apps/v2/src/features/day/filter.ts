/**
 * features/day/filter.ts — Oggi's facets (find.md §4, find.json `entries`):
 * domain and state. Facets come from the day's items with their counts; a
 * facet with one value says nothing and is not offered. Several values of
 * one facet widen (or), two facets narrow (and); nothing chosen is all.
 * Pure: tested without a browser.
 */
import type { DayItem } from "@/core/day";

export type Status = DayItem["status"];
export type Facet = "fam" | "status";
export type Selection = Record<Facet, string[]>;
export type Facetted = { fam: string; status: Status };

export const NONE: Selection = { fam: [], status: [] };

/** The state facet's words (find.json `values.status`). */
export const STATUS_LABEL: Record<Status, string> = {
  planned: "Previsto",
  done: "Fatto",
  skipped: "Saltato",
};
const STATUS_ORDER: Status[] = ["done", "planned", "skipped"];

/** `famOrder`: the domains in the registry's order, so a chip keeps its place day to day. */
export function facets(rows: readonly Facetted[], famOrder?: readonly string[]) {
  const count = (key: Facet, order?: readonly string[]) => {
    const n = new Map<string, number>();
    for (const r of rows) n.set(r[key], (n.get(r[key]) ?? 0) + 1);
    const values = [...n].map(([value, count]) => ({ value, count }));
    if (order) {
      const at = (v: string) => (order.includes(v) ? order.indexOf(v) : order.length);
      values.sort((a, b) => at(a.value) - at(b.value));
    }
    return values.length > 1 ? values : [];
  };
  return { fam: count("fam", famOrder), status: count("status", STATUS_ORDER) };
}

export function matches(r: Facetted, s: Selection): boolean {
  return (
    (s.fam.length === 0 || s.fam.includes(r.fam)) &&
    (s.status.length === 0 || s.status.includes(r.status))
  );
}

export function toggle(s: Selection, facet: Facet, value: string): Selection {
  const on = s[facet].includes(value);
  return {
    ...s,
    [facet]: on ? s[facet].filter((v) => v !== value) : [...s[facet], value],
  };
}

/** A remembered selection, kept only where the day still offers it. */
export function restore(raw: unknown, offered: ReturnType<typeof facets>): Selection {
  const r = (raw ?? {}) as Partial<Record<Facet, unknown>>;
  const keep = (f: Facet) =>
    Array.isArray(r[f])
      ? (r[f] as unknown[]).filter(
          (v): v is string =>
            typeof v === "string" && offered[f].some((o) => o.value === v),
        )
      : [];
  return { fam: keep("fam"), status: keep("status") };
}
