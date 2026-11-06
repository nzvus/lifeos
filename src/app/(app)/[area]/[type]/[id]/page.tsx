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
import { readObject } from "@/core/verbs";
import { ObjectView } from "@/features/objects/ObjectView";
import { valueRows } from "@/features/objects/present";
import { objects } from "@/i18n/objects";
import { objectUndo, objectVerb } from "./actions";

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
  const o = await readObject(await getDb(), owner, t.key, id);
  if (!o) notFound();
  return (
    <ObjectView
      back={{ label: t.area, href: `/${areaSlug(t)}/elenco` }}
      title={o.name}
      meta={o.archived ? `${t.name} · ${objects.archived}` : t.name}
      rows={valueRows(t, o.values)}
      verbs={t.verbs.filter((v) => ["archive", "restore", "delete"].includes(v))}
      archived={o.archived}
      type={t.key}
      id={o.id}
      run={objectVerb}
      revert={objectUndo}
    />
  );
}
