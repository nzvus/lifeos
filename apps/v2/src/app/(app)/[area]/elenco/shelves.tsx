/**
 * Cibo · Elenco and Corpo · Elenco (map D, architecture.md §10): the area's
 * title and tabs, its shelves as chips (Cibi · Pasti salvati · Dispensa;
 * Esercizi · Tragitti, `?vista=`, the first when missing), then the shelf —
 * a catalog's list with its search and sort (features/library), the pantry
 * or the routes. Decided by the agent (3 Nov, ledger UI-95). Server component.
 */
import { AREAS, AreaTabs, Box, F, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, logicalDay } from "@/core/engines/time";
import { readRoutes } from "@/core/movement/routes";
import { readPantry, SHOP_EVERY_DAYS, type PantryFood } from "@/core/pantry";
import { Library } from "@/features/library/Library";
import { stockWords } from "@/features/library/pantry";
import { MODE_WORDS } from "@/features/movement-words";
import { AREA_HREF, AREA_NAME, tabHrefs } from "@/features/places";
import { readLibrary } from "../../oggi/elenco/library-data";

type Shelf = "cibi" | "pasti" | "dispensa" | "esercizi" | "tragitti";
export const SHELVES = {
  cibo: [
    ["cibi", "Cibi"],
    ["pasti", "Pasti salvati"],
    ["dispensa", "Dispensa"],
  ],
  corpo: [
    ["esercizi", "Esercizi"],
    ["tragitti", "Tragitti"],
  ],
} as const satisfies Record<string, readonly (readonly [Shelf, string])[]>;
export type ShelfArea = keyof typeof SHELVES;
export const hasShelves = (a: string): a is ShelfArea => a in SHELVES;
const LIST = { cibi: "foods", pasti: "meals", esercizi: "exercises" } as const;

export async function AreaShelves({
  area,
  vista,
}: {
  area: ShelfArea;
  vista: string | undefined;
}) {
  const shelves = SHELVES[area];
  const shelf: Shelf = shelves.find(([k]) => k === vista)?.[0] ?? shelves[0][0];
  const owner = await requireOwner();
  const db = await getDb();
  const { clock, weights } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const href = (k: Shelf) =>
    AREA_HREF[area] + "/elenco" + (k === shelves[0][0] ? "" : "?vista=" + k);
  let body: React.ReactNode;
  let context: string;
  if (shelf === "dispensa") {
    const now = new Date();
    const foods = await readPantry(db, owner, today, now);
    context = "cosa hai in casa · spesa ogni " + SHOP_EVERY_DAYS + " giorni";
    body = <Pantry foods={foods} />;
  } else if (shelf === "tragitti") {
    const routes = await readRoutes(db, owner, addDays(today, -90));
    context = "quelli che fai spesso: da ⊕ basta un tocco";
    body = <Routes routes={routes} />;
  } else {
    const lib = await readLibrary(db, owner, today, clock, weights, shelf === "cibi");
    context = lib.shelfLines[LIST[shelf]];
    body = (
      <Library
        {...lib.lists}
        view={LIST[shelf]}
        only
        shelfLines={lib.shelfLines}
        trackers={{ all: 0, own: 0 }}
        routes={{ count: 0, line: "" }}
        pantry={{ count: 0, toBuy: 0 }}
      />
    );
  }
  return (
    <main className="k-page has-bd">
      <PageHeader
        title={AREA_NAME[area]}
        context={context}
        of={AREAS.find(([k]) => k === area)![2]}
      />
      <AreaTabs tab="elenco" hrefs={tabHrefs(area)} />
      <nav className="k-block" aria-label={"Elenchi di " + AREA_NAME[area]}>
        <div className="k-chips">
          {shelves.map(([k, label]) => (
            <a
              key={k}
              className={"k-chip" + (k === shelf ? " on" : "")}
              href={href(k)}
              aria-current={k === shelf ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
      {body}
      <div className="k-nav k-stick">
        <NavBar active={area} hrefs={AREA_HREF} addHref={"/aggiungi?area=" + area} />
      </div>
    </main>
  );
}

/** «Dispensa» (dossiers/pantry.md §6, V-12): «Da comprare» on top, then «In casa». */
function Pantry({ foods }: { foods: PantryFood[] }) {
  const buy = foods.filter((f) => f.toBuy);
  const home = foods.filter((f) => !f.toBuy);
  const row = (f: PantryFood) => (
    <Box
      key={f.foodId}
      density="row"
      rail={false}
      entry={{
        fam: "food",
        of: { kind: "ingredient" },
        title: f.name,
        ...stockWords(f.stock, f.unit),
        href: "/libreria/cibo/" + f.foodId + "#dispensa",
        hrefLabel: "Apri " + f.name,
      }}
    />
  );
  if (foods.length === 0)
    return (
      <section className="k-section g2" aria-label="Dispensa vuota">
        <p className="k-help">
          Segna cosa compri e la dispensa si tiene da sola: quello che mangi lo toglie
          lei. Apri un cibo in Cibi e premi «Comprato».
        </p>
      </section>
    );
  return (
    <>
      <section className="k-section g2" aria-label="Da comprare">
        <h2>Da comprare</h2>
        {buy.length === 0 ? (
          <p className="k-help">Niente finisce prima della prossima spesa.</p>
        ) : (
          buy.map(row)
        )}
      </section>
      {home.length > 0 && (
        <section className="k-section g2" aria-label="In casa">
          <h2>In casa</h2>
          {home.map(row)}
        </section>
      )}
    </>
  );
}

/** «Tragitti» (dossiers/movement.md, slice 1): the most used first, each with its Maps link. */
function Routes({ routes }: { routes: Awaited<ReturnType<typeof readRoutes>> }) {
  return (
    <section className="k-section g2" aria-label="I tuoi tragitti">
      {routes.length === 0 ? (
        <p className="k-help">
          Ancora nessun tragitto. Aggiungi quelli che fai spesso; poi da ⊕ → Tragitto
          basta un tocco.
        </p>
      ) : (
        routes.map((r) => (
          <Box
            key={r.id}
            density="row"
            rail={false}
            entry={{
              fam: "train",
              of: { kind: "trip" },
              title: r.name,
              value: r.distanceKm !== null ? F.num(r.distanceKm, "km") : "",
              meta: [
                MODE_WORDS[r.mode] ?? r.mode,
                r.durationMin !== null ? F.hm(r.durationMin) : "",
                // On foot the whole way says nothing new; by transport, the metres walked.
                r.walkingM !== null && r.mode !== "walk" && r.mode !== "run"
                  ? F.num(r.walkingM, "m") + " a piedi"
                  : "",
                r.uses ? F.plural(r.uses, "volta", "volte") + " in 90 giorni" : "",
              ]
                .filter(Boolean)
                .join(" · "),
              ...(r.mapsUrl ? { href: r.mapsUrl, hrefLabel: "Apri in Maps" } : {}),
            }}
          />
        ))
      )}
      <a className="k-link" href="/libreria/tragitto/nuovo">
        + Nuovo tragitto
      </a>
    </section>
  );
}
