/**
 * The choices of a type's `ref` fields (PAT-30, PAT-61): his live objects of each field's
 * catalog, by field key — a blocco's «Rispetto a» lists his other blocchi. Read by the page and
 * by the type's new form.
 */
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import { typeOfItem, type CatalogType } from "@/core/kinds/catalog";
import { listObjects } from "@/core/verbs";
import type { Refs } from "@/features/objects/present";

export async function readRefs(
  db: Db,
  owner: Owner,
  t: CatalogType,
  self?: string,
): Promise<Refs> {
  const out: Record<string, { id: string; name: string }[]> = {};
  for (const f of t.fields) {
    const of = f.type === "ref" && f.catalog ? typeOfItem(f.catalog) : undefined;
    if (of)
      out[f.key] = (await listObjects(db, owner, of.key)).filter((x) => x.id !== self);
  }
  return out;
}
