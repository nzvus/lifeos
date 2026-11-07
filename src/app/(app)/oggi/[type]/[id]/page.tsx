/**
 * `/oggi/{type}/{id}` (PAT-04): Oggi's objects (his trackers). `oggi` is a folder of its own, so
 * Next serves it before `[area]`: this route mounts the same family page with the area fixed.
 */
import { objectRoute, type Query } from "../../../[area]/[type]/[id]/object-route";

export default async function OggiObjectRoute({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<Query>;
}) {
  const { type, id } = await params;
  return objectRoute("oggi", type, id, await searchParams);
}
