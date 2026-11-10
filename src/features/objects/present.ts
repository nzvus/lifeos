/**
 * The values of one catalog object as its ObjectPage lists them (PAT-04, PAT-13, PAT-30,
 * PAT-50): every field the registry declares, in order, with its word (objects.ts, or the
 * field's own label), its value as shown (through `F`, a choice in its words, «» when empty)
 * and the form spec the kit's `InPlace` edits it with.
 */
import { F, readRecurrence, recurrenceText, type FormFieldSpec } from "@lifeos/kit";
import type { CatalogType } from "@/core/kinds/catalog";
import type { Values } from "@/core/verbs";
import { objects } from "@/i18n/objects";
import { plan } from "@/i18n/plan";
import { MODE_WORDS } from "../movement-words";

/** The words of a `choice` field's values, per type and field. */
const CHOICE_WORDS: Record<string, Record<string, Record<string, string>>> = {
  route: { mode: MODE_WORDS },
  cycle: { advance: plan.cycle.advance, onSkip: plan.cycle.onSkip },
  block: { when: plan.block.when },
};

/** What a field means, under it while it is edited, per type and field. */
const FIELD_HELP: Record<string, Record<string, string>> = {
  cycle: plan.cycle.help,
  block: plan.block.help,
};

export type ObjectField = {
  spec: FormFieldSpec;
  value: string | number | boolean | null;
  shown: string;
};

export function fieldWord(t: CatalogType, key: string): string | undefined {
  return t.fields.find((f) => f.key === key)?.label ?? objects.fields[t.key]?.[key];
}

/** A new object's form (PAT-11, PAT-61): its name, then the type's declared fields. */
export function newFields(t: CatalogType, refs: Refs = {}): FormFieldSpec[] {
  return [
    { key: "name", label: objects.name, type: "text", required: true },
    ...objectFields(t, {}, refs).map((f) => f.spec),
  ];
}

/** A `ref` field's choices: his objects of its catalog, by field key (the page reads them). */
export type Refs = Readonly<Record<string, readonly { id: string; name: string }[]>>;

export function objectFields(
  t: CatalogType,
  values: Values,
  refs: Refs = {},
): ObjectField[] {
  return t.fields
    .filter((f) => !f.internal && (f.type !== "ref" || refs[f.key]))
    .map((f) => {
      // A ref is a choice of his objects (PAT-30), shown by name (decided by the agent).
      const of = refs[f.key];
      const words = of
        ? Object.fromEntries(of.map((o) => [o.id, o.name]))
        : (CHOICE_WORDS[t.key]?.[f.key] ?? {});
      const spec: FormFieldSpec = {
        key: f.key,
        label: fieldWord(t, f.key) ?? f.key,
        type: of ? "choice" : (f.type as FormFieldSpec["type"]),
        ...(f.unit ? { unit: f.unit } : {}),
        ...(f.min !== undefined ? { min: f.min } : {}),
        ...(f.max !== undefined ? { max: f.max } : {}),
        ...(f.scale ? { scale: f.scale } : {}),
        ...(f.required ? { required: true } : {}),
        ...(FIELD_HELP[t.key]?.[f.key] ? { help: FIELD_HELP[t.key]![f.key]! } : {}),
        ...(of
          ? { choices: of.map((o) => ({ value: o.id, label: o.name })) }
          : f.choices
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
              : f.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(v)
                ? F.date(v)
                : f.type === "recurrence"
                  ? recurrenceText(readRecurrence(v)) || v
                  : (words[v] ?? v);
      return { spec, value: v, shown };
    });
}

/**
 * The verbs an object's page offers (PAT-16…20): what its type declares, «Parti da» / «Variante»
 * only when its create form can start from an object, «Unisci» only with another to merge into.
 */
export function pageVerbs(
  t: CatalogType,
  starts: readonly string[],
  hasOthers: boolean,
): string[] {
  const page = [
    ...starts,
    "archive",
    "restore",
    "delete",
    ...(hasOthers ? ["merge"] : []),
  ];
  return t.verbs.filter((v) => page.includes(v));
}

/** «Unisci» (PAT-18): what moves when `gone` goes into `keep`, from `mergePreview`'s counts. */
export function mergeLines(
  n: { entries: number; lines: number; plans: number },
  gone: string,
  keep: string,
): string[] {
  const w = objects.merge;
  const out: string[] = [];
  for (const k of ["entries", "lines", "plans"] as const)
    if (n[k] > 0) out.push(`${F.plural(n[k], w[k][0], w[k][1])} «${keep}».`);
  if (out.length === 0) out.push(w.nothing(gone));
  out.push(w.after(gone, keep));
  return out;
}
