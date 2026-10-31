/**
 * An area's Piano, Elenco or Andamento (map D, first slice): its title, the four
 * tabs, the rows of what it holds today (features/area-index.ts) or its empty
 * state, the bar. Server component.
 */
import { notFound } from "next/navigation";
import { AREAS, AreaTabs, Box, NavBar, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { AREA_INDEX, EMPTY_TAB, type IndexTab } from "@/features/area-index";
import { AREA_HREF, AREA_NAME, isDomainArea, tabHrefs } from "@/features/places";

export async function AreaIndex({
  params,
  tab,
}: {
  params: Promise<{ area: string }>;
  tab: IndexTab;
}) {
  await requireOwner();
  const { area } = await params;
  if (!isDomainArea(area)) notFound();
  const rows = AREA_INDEX[area][tab];
  return (
    <main className="k-page">
      <PageHeader title={AREA_NAME[area]} of={AREAS.find(([k]) => k === area)![2]} />
      <AreaTabs tab={tab} hrefs={tabHrefs(area)} />
      <section className="k-section g2" aria-label={AREA_NAME[area]}>
        {rows.length === 0 ? (
          <p className="k-empty k-meta">{EMPTY_TAB[tab]}</p>
        ) : (
          rows.map((r) => (
            <Box
              key={r.title}
              density="row"
              rail={false}
              entry={{ ...r, hrefLabel: r.title }}
            />
          ))
        )}
      </section>
      <div className="k-nav k-stick">
        <NavBar active={area} hrefs={AREA_HREF} addHref={"/aggiungi?area=" + area} />
      </div>
    </main>
  );
}
