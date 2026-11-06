/**
 * An area's Piano, Elenco or Andamento (map D, first slice): its title, the four
 * tabs, the rows of what it holds today (features/area-index.ts) or its empty
 * state, the bar; an Andamento adds the person's own trackers of the area (by
 * their kind's domain). Server component.
 */
import { notFound } from "next/navigation";
import { AREAS, AreaTabs, Box, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readUserKinds } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { listUserKinds } from "@/core/kinds/user";
import { AREA_INDEX, EMPTY_TAB, type IndexTab } from "@/features/area-index";
import {
  AREA_NAME,
  areaOf,
  isDomainArea,
  tabHrefs,
  trackerHref,
} from "@/features/places";

export async function AreaIndex({
  params,
  tab,
}: {
  params: Promise<{ area: string }>;
  tab: IndexTab;
}) {
  const owner = await requireOwner();
  const { area } = await params;
  if (!isDomainArea(area)) notFound();
  // The person's trackers as the tracker page reads them (the same registry), so a
  // listed one always opens (ledger UI-101): a kind the registry refuses is not listed.
  const db = await getDb();
  const valid = async () => {
    const opens = new Set(
      kindRegistry(await readUserKinds(db, owner)).all.map((k) => k.key),
    );
    return (await listUserKinds(db, owner)).filter((k) => opens.has(k.key));
  };
  const own =
    tab === "andamento"
      ? (await valid())
          .filter((k) => !k.archived && areaOf(k.domain) === area)
          .map((k) => ({
            fam: k.family,
            title: k.name,
            meta: "il tuo tracker",
            href: trackerHref(k.key, k.domain),
          }))
      : [];
  const rows = [...AREA_INDEX[area][tab], ...own];
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
    </main>
  );
}
