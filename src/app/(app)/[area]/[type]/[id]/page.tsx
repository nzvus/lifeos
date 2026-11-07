/**
 * `/{area}/{type}/{id}` — one route for every catalog object (PAT-04): the type comes from the
 * registry by its word, the page is the generic ObjectPage (PAT-30). A type that still has its
 * own folder (cibo, pasto, esercizio, tragitto…) is served by that folder until its change in
 * phase 4 moves it here and deletes the folder.
 */
import { objectRoute, type Query } from "./object-route";

export default async function ObjectRoute({
  params,
  searchParams,
}: {
  params: Promise<{ area: string; type: string; id: string }>;
  searchParams: Promise<Query>;
}) {
  const { area, type, id } = await params;
  return objectRoute(area, type, id, await searchParams);
}
