/**
 * An area's Piano (PAT-03, MOD-32, PL-70; change 2026-11-07-piano): the area's blocchi — and in
 * Corpo the cicli, the gym's — as the kit `Elenco` (active · archived, each to its page,
 * «+ Nuovo blocco»). Oggi's Piano is the week of every area (`oggi/piano`). Day models,
 * «Giornate tipo» and the habits' own list are gone: an abitudine is a blocco of its type (PL-03).
 */
import { notFound } from "next/navigation";
import { AreaFilter, Elenco, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listBlocks, readCycleBook } from "@/core/plans";
import { AREA_NAME, isDomainArea, areaHrefs, placeHead } from "@/features/places";
import { planSections } from "@/features/plan/plan-sections";


export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ area: string }>;
  searchParams: Promise<{ archiviati?: string | string[] }>;
}) {
  const { area } = await params;
  if (!isDomainArea(area)) notFound();
  const archived = (await searchParams).archiviati === "1";
  const owner = await requireOwner();
  const db = await getDb();
  const [blocks, book] = await Promise.all([
    listBlocks(db, owner, archived),
    // Giornate tipo span every area (proposal §30): every area's Piano lists them.
    readCycleBook(db, owner),
  ]);
  const href = "/" + area + "/piano";
  return (
    <main className="k-page has-bd">
      <PageHeader {...placeHead("piano")} />
      <AreaFilter area={area} hrefs={areaHrefs("piano")} />
      <Elenco
        archived={archived}
        filterHref={{ active: href, archived: href + "?archiviati=1" }}
        sections={planSections({
          blocks,
          cycles: book?.cycles ?? null,
          archived,
          area: AREA_NAME[area],
        })}
      />
    </main>
  );
}
