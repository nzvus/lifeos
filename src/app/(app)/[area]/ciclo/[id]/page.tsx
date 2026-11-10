/**
 * The old address of a ciclo's editor: a ciclo is a catalog object now (MOD-36, PAT-04), its
 * page the generic one at `/oggi/ciclo/<id>`. Kept so his bookmarks and old links still land.
 */
import { redirect } from "next/navigation";

export default async function OldCyclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect("/oggi/ciclo/" + (await params).id);
}
