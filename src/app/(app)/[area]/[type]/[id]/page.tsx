/**
 * `/{area}/{type}/{id}` — one route for every catalog object (PAT-04): the type comes from the
 * registry by its word, the page is the generic ObjectPage (PAT-30). A type that still has its
 * own folder (cibo, pasto, esercizio, tragitto…) is served by that folder until its change in
 * phase 4 moves it here and deletes the folder.
 */
import { notFound, redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { areaSlug, typeAtSlug } from "@/core/kinds/catalog";
import { listObjects, readObject } from "@/core/verbs";
import { ObjectView } from "@/features/objects/ObjectView";
import { objectFields } from "@/features/objects/present";
import { objects } from "@/i18n/objects";
import {
  objectEdit,
  objectMerge,
  objectMergePreview,
  objectUndo,
  objectVerb,
} from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ObjectRoute({
  params,
}: {
  params: Promise<{ area: string; type: string; id: string }>;
}) {
  const owner = await requireOwner();
  const { area, type, id } = await params;
  const t = typeAtSlug(type);
  if (!t) notFound();
  if (area !== areaSlug(t)) redirect(`/${areaSlug(t)}/${type}/${id}`);
  if (!UUID.test(id)) notFound();
  const db = await getDb();
  const o = await readObject(db, owner, t.key, id);
  if (!o) notFound();
  const others = t.verbs.includes("merge")
    ? (await listObjects(db, owner, t.key)).filter((x) => x.id !== o.id)
    : [];
  return (
    <ObjectView
      back={{ label: t.area, href: `/${areaSlug(t)}/elenco` }}
      title={o.name}
      meta={o.archived ? `${t.name} · ${objects.archived}` : t.name}
      fields={objectFields(t, o.values)}
      others={others}
      typeName={t.name}
      verbs={t.verbs.filter((v) =>
        ["archive", "restore", "delete", ...(others.length ? ["merge"] : [])].includes(v),
      )}
      archived={o.archived}
      type={t.key}
      id={o.id}
      run={objectVerb}
      save={objectEdit}
      revert={objectUndo}
      mergePreview={objectMergePreview}
      merge={objectMerge}
    />
  );
}
