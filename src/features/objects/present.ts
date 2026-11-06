/**
 * The values of one catalog object as its ObjectPage lists them (PAT-04, PAT-30, PAT-50): the
 * registry's declared fields in order, each with its word (objects.ts, or the field's own
 * label), its value through `F`, a choice through its words; empty values are left out.
 */
import { F } from "@lifeos/kit";
import type { CatalogType } from "@/core/kinds/catalog";
import type { Values } from "@/core/verbs";
import { objects } from "@/i18n/objects";
import { MODE_WORDS } from "../movement-words";

/** The words of a `choice` field's values, per type and field. */
const CHOICE_WORDS: Record<string, Record<string, Record<string, string>>> = {
  route: { mode: MODE_WORDS },
};

export type ValueRow = { key: string; label: string; value: string; href?: string };

export function fieldWord(t: CatalogType, key: string): string | undefined {
  return t.fields.find((f) => f.key === key)?.label ?? objects.fields[t.key]?.[key];
}

export function valueRows(t: CatalogType, values: Values): ValueRow[] {
  const rows: ValueRow[] = [];
  for (const f of t.fields) {
    const v = values[f.key];
    if (v === null || v === undefined || v === "") continue;
    const label = fieldWord(t, f.key) ?? f.key;
    if (typeof v === "number")
      rows.push({ key: f.key, label, value: F.num(v, f.unit ?? "") });
    else if (typeof v === "boolean")
      rows.push({ key: f.key, label, value: v ? objects.yes : objects.no });
    else if (f.type === "choice")
      rows.push({ key: f.key, label, value: CHOICE_WORDS[t.key]?.[f.key]?.[v] ?? v });
    else if (/^https?:\/\//.test(v)) rows.push({ key: f.key, label, value: v, href: v });
    else rows.push({ key: f.key, label, value: v });
  }
  return rows;
}
