/**
 * The values of one catalog object as its ObjectPage lists them (PAT-04, PAT-13, PAT-30,
 * PAT-50): every field the registry declares, in order, with its word (objects.ts, or the
 * field's own label), its value as shown (through `F`, a choice in its words, «» when empty)
 * and the form spec the kit's `InPlace` edits it with.
 */
import { F, type FormFieldSpec } from "@lifeos/kit";
import type { CatalogType } from "@/core/kinds/catalog";
import type { Values } from "@/core/verbs";
import { objects } from "@/i18n/objects";
import { MODE_WORDS } from "../movement-words";

/** The words of a `choice` field's values, per type and field. */
const CHOICE_WORDS: Record<string, Record<string, Record<string, string>>> = {
  route: { mode: MODE_WORDS },
};

export type ObjectField = {
  spec: FormFieldSpec;
  value: string | number | boolean | null;
  shown: string;
};

export function fieldWord(t: CatalogType, key: string): string | undefined {
  return t.fields.find((f) => f.key === key)?.label ?? objects.fields[t.key]?.[key];
}

export function objectFields(t: CatalogType, values: Values): ObjectField[] {
  return t.fields
    .filter((f) => f.type !== "ref")
    .map((f) => {
      const words = CHOICE_WORDS[t.key]?.[f.key] ?? {};
      const spec: FormFieldSpec = {
        key: f.key,
        label: fieldWord(t, f.key) ?? f.key,
        type: f.type as FormFieldSpec["type"],
        ...(f.unit ? { unit: f.unit } : {}),
        ...(f.min !== undefined ? { min: f.min } : {}),
        ...(f.max !== undefined ? { max: f.max } : {}),
        ...(f.scale ? { scale: f.scale } : {}),
        ...(f.required ? { required: true } : {}),
        ...(f.choices
          ? { choices: f.choices.map((c) => ({ value: c, label: words[c] ?? c })) }
          : {}),
      };
      const v = values[f.key] ?? null;
      const shown =
        v === null || v === ""
          ? ""
          : typeof v === "number"
            ? F.num(v, f.unit ?? "")
            : typeof v === "boolean"
              ? v
                ? objects.yes
                : objects.no
              : (words[v] ?? v);
      return { spec, value: v, shown };
    });
}
