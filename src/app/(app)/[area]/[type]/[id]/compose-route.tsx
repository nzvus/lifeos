/**
 * `/{area}/{type}/{id}/componi` (PAT-04, PAT-62): a type with lines composed again in its
 * Composer (a pasto's cibi, a scheda's exercises, a ciclo's steps), found by its word in the
 * registry. Mounted by `[area]/[type]/[id]/componi` and again by `oggi/[type]/[id]/componi`
 * (the `oggi` folder wins over `[area]`).
 */
import { notFound, redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { areaSlug, typeAtSlug } from "@/core/kinds/catalog";
import { readObject } from "@/core/verbs";
import { COMPOSERS } from "./new-forms";

export async function composeRoute(area: string, type: string, id: string) {
  const owner = await requireOwner();
  const t = typeAtSlug(type);
  const compose = t ? COMPOSERS[t.key] : undefined;
  if (!t || !compose) notFound();
  if (area !== areaSlug(t)) redirect(`/${areaSlug(t)}/${type}/${id}/componi`);
  if (!(await readObject(await getDb(), owner, t.key, id).catch(() => null))) notFound();
  return compose(id);
}
