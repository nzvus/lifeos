/**
 * Oggi · Elenco (flows.md §1, V-07; map D): one search across every catalog,
 * the shelves, «Aggiungere». A shelf lives in its area's Elenco (architecture.md
 * §10): the old `?vista=cibi|pasti|esercizi` goes there.
 */
import { redirect } from "next/navigation";
import {
  AreaTabs,
  Elenco,
  F,
  PageHeader,
  readRecurrence,
  recurrenceText,
} from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, logicalDay } from "@/core/engines/time";
import { readUserKinds } from "@/core/day";
import { enterable } from "@/core/entries";
import { kindRegistry } from "@/core/kinds";
import { listUserKinds } from "@/core/kinds/user";
import { readRoutes } from "@/core/movement/routes";
import { readPantry } from "@/core/pantry";
import { listBlocks, readCycleBook } from "@/core/plans";
import { Library } from "@/features/library/Library";
import { tabHrefs } from "@/features/places";
import { plan } from "@/i18n/plan";
import { tracker, wordOf } from "@/i18n/tracker";
import { readLibrary } from "./library-data";

const MOVED: Record<string, string> = {
  cibi: "/cibo/elenco",
  pasti: "/cibo/elenco?vista=pasti",
  esercizi: "/corpo/elenco",
};

export default async function LibreriaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string | string[]; archiviati?: string | string[] }>;
}) {
  const asked = (await searchParams).vista;
  const archived = (await searchParams).archiviati === "1";
  if (typeof asked === "string" && MOVED[asked]) redirect(MOVED[asked]);
  const owner = await requireOwner();
  const db = await getDb();
  const { clock, weights } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const [lib, routes, pantry, userKinds, mine, blocks, cycles] = await Promise.all([
    readLibrary(db, owner, today, clock, weights, false),
    readRoutes(db, owner, addDays(today, -90)),
    readPantry(db, owner, today, new Date()),
    readUserKinds(db, owner),
    listUserKinds(db, owner),
    listBlocks(db, owner, archived),
    readCycleBook(db, owner),
  ]);
  const p = plan.elenco;
  const blockRows = blocks.map((b) => ({
    id: b.id,
    name: b.name,
    href: "/oggi/blocco/" + b.id,
    meta: [b.area, recurrenceText(readRecurrence(b.recurrence))]
      .filter(Boolean)
      .join(" · "),
  }));
  const cycleRows = cycles.cycles
    .filter((c) => c.active !== archived)
    .map((c) => ({
      id: c.id,
      name: c.name,
      href: "/oggi/ciclo/" + c.id,
      meta: p.steps(c.steps.length),
    }));
  const w = tracker.page;
  const trackerRows = mine
    .filter((k) => k.archived === archived)
    .map((k) => ({
      id: k.id,
      name: k.name,
      href: "/oggi/tracker/" + k.id,
      meta: [
        wordOf(tracker.families, k.family),
        wordOf(tracker.shapes, k.shape).toLowerCase(),
        k.fields ? F.plural(k.fields, "campo", "campi") : null,
      ]
        .filter(Boolean)
        .join(" · "),
    }));
  // «Tipi di tracker»: the kinds ⊕ can enter, the person's own among them.
  const live = userKinds.filter((k) => !k.archivedAt);
  const trackers = {
    all: kindRegistry(live).all.filter(enterable).length,
    own: live.length,
  };
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Oggi"
        context="le cose che riusi: cibi, pasti, esercizi, dispensa, tragitti"
        of={{ place: "oggi" }}
      />
      <AreaTabs tab="elenco" hrefs={tabHrefs("oggi")} />
      <Library
        {...lib.lists}
        view={null}
        shelfLines={lib.shelfLines}
        trackers={trackers}
        pantry={{ count: pantry.length, toBuy: pantry.filter((p) => p.toBuy).length }}
        routes={{
          count: routes.length,
          line: routes.length
            ? "più usati: " +
              routes
                .slice(0, 2)
                .map((r) => r.name)
                .join(", ")
            : "casa → palestra, casa → lavoro: poi basta un tocco",
        }}
      />
      <Elenco
        archived={archived}
        filterHref={{
          active: "/oggi/elenco#tracker",
          archived: "/oggi/elenco?archiviati=1#tracker",
        }}
        sections={[
          {
            key: "tracker",
            title: w.section,
            rows: trackerRows,
            add: { label: w.add, href: "/oggi/tracker/nuovo" },
            empty: archived ? w.emptyArchived : w.empty,
          },
          {
            key: "blocchi",
            title: p.blocks,
            rows: blockRows,
            add: { label: p.addBlock, href: "/oggi/blocco/nuovo" },
            empty: archived ? p.emptyArchived : p.emptyBlocks,
          },
          {
            key: "cicli",
            title: p.cycles,
            rows: cycleRows,
            add: { label: p.addCycle, href: "/oggi/ciclo/nuovo" },
            empty: archived ? p.emptyArchived : p.emptyCycles,
          },
        ]}
      />
    </main>
  );
}
