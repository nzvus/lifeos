/**
 * A Piano (PAT-03, PAT-97, MOD-32, PL-70): what repeats, and nothing else — the cicli and the
 * blocchi outside them as the kit `Elenco` (active · archived, each to its page, «+ Nuovo ciclo»).
 * Oggi · Piano shows every area, an area's Piano its own. No days here: every day lives in Oggi
 * (his 15 Nov: «in piano a questo punto è inutile avere le giornate o cose simili», proposal §43).
 */
import { AreaFilter, Elenco, PageHeader, type Area } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listBlocks, readCycleBook } from "@/core/plans";
import { AREA_NAME, areaHrefs, placeHead } from "@/features/places";
import { planSections } from "@/features/plan/plan-sections";

export async function PianoList({ area, archived }: { area: Area; archived: boolean }) {
  const owner = await requireOwner();
  const db = await getDb();
  const [blocks, book] = await Promise.all([
    listBlocks(db, owner, archived),
    // Giornate tipo span every area (proposal §30): every Piano lists them.
    readCycleBook(db, owner),
  ]);
  const href = area === "oggi" ? "/oggi/piano" : "/" + area + "/piano";
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
          area: area === "oggi" ? null : AREA_NAME[area],
        })}
      />
    </main>
  );
}
