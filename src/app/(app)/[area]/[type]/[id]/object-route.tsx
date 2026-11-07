/**
 * The family page of one object (PAT-04, PAT-30), mounted by `[area]/[type]/[id]` and by
 * `oggi/[type]/[id]` (Next serves the `oggi` folder before `[area]`).
 */
import { notFound, redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { areaSlug, typeAtSlug } from "@/core/kinds/catalog";
import { listObjects, readObject } from "@/core/verbs";
import { ObjectView } from "@/features/objects/ObjectView";
import { objectFields, pageVerbs } from "@/features/objects/present";
import { objects } from "@/i18n/objects";
import {
  objectEdit,
  objectMerge,
  objectMergePreview,
  objectRename,
  objectUndo,
  objectVerb,
} from "./actions";
import { EXTRAS } from "./extras";
import { NEW_FORMS } from "./new-forms";

export type Query = Readonly<Record<string, string | string[] | undefined>>;
const one = (q: Query) =>
  Object.fromEntries(
    Object.entries(q).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  ) as Record<string, string | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The page of one object at `/{area}/{type}/{id}` (also mounted by `oggi/[type]/[id]`). */
export async function objectRoute(
  area: string,
  type: string,
  id: string,
  query: Query = {},
) {
  const owner = await requireOwner();
  const t = typeAtSlug(type);
  if (!t) notFound();
  if (area !== areaSlug(t)) redirect(`/${areaSlug(t)}/${type}/${id}`);
  if (id === "nuovo") {
    const form = NEW_FORMS[t.key];
    if (!form) notFound();
    return await form.render(
      { label: t.area, href: `/${areaSlug(t)}/elenco` },
      one(query),
    );
  }
  if (!UUID.test(id)) notFound();
  const db = await getDb();
  const o = await readObject(db, owner, t.key, id);
  if (!o) notFound();
  const extra = (await EXTRAS[t.key]?.(db, owner, o.id, one(query))) ?? {};
  const others = t.verbs.includes("merge")
    ? (await listObjects(db, owner, t.key)).filter((x) => x.id !== o.id)
    : [];
  return (
    <ObjectView
      back={{ label: t.area, href: `/${areaSlug(t)}/elenco` }}
      title={o.name}
      meta={[t.name, extra.meta, o.archived ? objects.archived : null]
        .filter(Boolean)
        .join(" · ")}
      fields={objectFields(t, o.values)}
      {...(extra.summary ? { summary: extra.summary } : {})}
      {...(extra.parts ? { parts: extra.parts } : {})}
      {...(extra.progress ? { progress: extra.progress } : {})}
      {...(extra.usedIn ? { usedIn: extra.usedIn } : {})}
      others={others}
      typeName={t.name}
      verbs={pageVerbs(t, NEW_FORMS[t.key]?.from ?? [], others.length > 0)}
      newHref={`/${areaSlug(t)}/${type}/nuovo`}
      archived={o.archived}
      type={t.key}
      id={o.id}
      run={objectVerb}
      save={objectEdit}
      rename={objectRename}
      revert={objectUndo}
      mergePreview={objectMergePreview}
      merge={objectMerge}
    />
  );
}
