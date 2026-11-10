/**
 * PAT-11: a new object of a type with plain declared fields from its generated form, through
 * `core/verbs` create — its id, or the form again with the field's words or the refusal's.
 * Shared by `objectCreate` and the blocco made from a voce (PL-44). Server only.
 */
import { readForm } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { catalogType, type CatalogType } from "@/core/kinds/catalog";
import { act } from "@/core/verbs";
import type { NewObjectState } from "@/features/objects/NewObjectForm";
import { newFields } from "@/features/objects/present";
import { objects } from "@/i18n/objects";

export async function createObject(
  type: string,
  prev: NewObjectState,
  data: FormData,
): Promise<NewObjectState | { id: string; t: CatalogType }> {
  const t = catalogType(type);
  const specs = t ? newFields(t) : [];
  const { values, errors } = readForm(specs, (k) =>
    typeof data.get(k) === "string" ? String(data.get(k)) : null,
  );
  const again = (e: Record<string, string>): NewObjectState => ({
    errors: e,
    values,
    n: prev.n + 1,
  });
  if (!t) return again({ form: objects.refused.other });
  if (Object.keys(errors).length) return again(errors);
  const { name, ...rest } = values;
  const r = await act(await getDb(), await requireOwner(), "create", type, null, {
    name: String(name ?? ""),
    values: rest,
  });
  if (!r.ok)
    return again(
      r.refused === "name_taken"
        ? { name: objects.refused.name_taken }
        : { form: objects.refused.other },
    );
  return { id: r.id, t };
}
