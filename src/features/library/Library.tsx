"use client";
/**
 * Libreria (V-07; the board: an index). With no view: one search across
 * every catalog (results as you type, find.md §6), the shelves (foods, saved
 * meals, exercises: counts and a line each) and «Aggiungere». A shelf opens
 * its list (`?vista=`): an instant search and a sort by use, name or a
 * nutrient (alone or per 100 kcal); each row shows the sort's number.
 * Pantry and tracker kinds join the shelves with their slices. In an area's
 * Elenco (map D) a list stands alone (`only`): the area's own shelves switch
 * above it, as links.
 */
import { useState } from "react";
import { Box, F, Field, List as KitList, MealBox, type PlanAction } from "@lifeos/kit";
import { useObjectVerbs, type VerbServer } from "@/features/objects/use-object-verbs";
import { food } from "@/i18n/food";
import { ExercisePlanBox, FoodPlanBox } from "./boxes";
import { mealSlots } from "@/features/box/meal";
import { partRows } from "./meal-rows";
import { listRows, sortValue, SORTS, type LibraryRow, type SortKey } from "./library";

const w = food.meal;
const UNITS: Partial<Record<SortKey, string>> = {
  kcal: "kcal",
  protein: "g",
  proteinPerKcal: "g",
  fibre: "g",
  e1rm: "kg",
};
const TABS = {
  foods: {
    label: "Cibi",
    sorts: ["uses", "name", "score", "kcal", "protein", "proteinPerKcal", "fibre"],
  },
  meals: {
    label: "Pasti salvati",
    sorts: ["uses", "name", "kcal", "protein", "proteinPerKcal", "fibre"],
  },
  exercises: { label: "Esercizi", sorts: ["uses", "name", "e1rm"] },
} as const satisfies Record<string, { label: string; sorts: readonly SortKey[] }>;
type Tab = keyof typeof TABS;
/** Each list's place (map D, architecture.md §10): its area's Elenco. */
const LIST_HREF: Record<Tab, string> = {
  foods: "/cibo/elenco",
  meals: "/cibo/elenco?vista=pasti",
  exercises: "/corpo/elenco",
};
/** The drawing of a list's rows and shelf (the board: kind ingredient, recipe, exercise). */
const SHELF_OF: Record<Tab, { fam: "food" | "train"; kind: string }> = {
  foods: { fam: "food", kind: "ingredient" },
  meals: { fam: "food", kind: "recipe" },
  exercises: { fam: "train", kind: "exercise" },
};
const SHOWN_PER_LIST = 5;

export function Library({
  foods,
  meals,
  exercises,
  view,
  shelfLines,
  trackers,
  routes,
  pantry,
  only,
  server,
}: {
  /** The verbs' server side (server actions from the page), for each box's actions row. */
  server: VerbServer;
  /** An area's Elenco: just this list, no switch of its own. */
  only?: boolean;
  /** The kinds one can enter, and how many are the person's own («Tipi di tracker»). */
  trackers: { all: number; own: number };
  /** The person's routes: how many, and its shelf's line («Tragitti»). */
  routes: { count: number; line: string };
  /** The foods at home and how many to buy («Dispensa»). */
  pantry: { count: number; toBuy: number };
  foods: LibraryRow[];
  meals: LibraryRow[];
  exercises: LibraryRow[];
  /** The list shown, or null for the index. */
  view: Tab | null;
  /** Each shelf's line under its name (counts, what is used most). */
  shelfLines: Record<Tab, string>;
}) {
  const lists: Record<Tab, LibraryRow[]> = { foods, meals, exercises };
  if (view === null)
    return (
      <Index
        lists={lists}
        shelfLines={shelfLines}
        trackers={trackers}
        routes={routes}
        pantry={pantry}
      />
    );
  return <List lists={lists} first={view} alone={only ?? false} server={server} />;
}

/**
 * A row's entry: a row that opens in place keeps its page for the icon beside its doors. `sub`
 * false when its open box lists what the line only counts (a cibo's marche, §129).
 */
function row(tab: Tab, r: LibraryRow, value: string, sub = true) {
  return {
    ...SHELF_OF[tab],
    of: tab === "meals" ? { kind: "meal" } : (r.of ?? {}),
    title: r.name,
    ...(sub && r.sub ? { meta: r.sub } : {}),
    value,
    ...(r.href ? { href: r.href } : {}),
    ...(r.score ? { score: r.score } : {}),
  };
}

/** The index: one search across every catalog, the shelves, «Aggiungere». */
function Index({
  lists,
  shelfLines,
  trackers,
  routes,
  pantry,
}: {
  lists: Record<Tab, LibraryRow[]>;
  shelfLines: Record<Tab, string>;
  trackers: { all: number; own: number };
  routes: { count: number; line: string };
  pantry: { count: number; toBuy: number };
}) {
  const [query, setQuery] = useState("");
  const all = (Object.keys(TABS) as Tab[]).reduce((n, t) => n + lists[t].length, 0);
  const found = (Object.keys(TABS) as Tab[]).map((t) => ({
    t,
    rows: listRows(lists[t], query, "uses").slice(0, SHOWN_PER_LIST),
  }));
  return (
    <>
      <section className="k-section g3" aria-label="Cerca">
        <input
          className="k-text"
          type="search"
          placeholder={"cerca tra " + F.plural(all, "cosa", "cose")}
          aria-label="Cerca in tutta la libreria"
          value={query}
          onChange={(x) => setQuery(x.target.value)}
        />
        {query.trim() !== "" &&
          found.map(({ t, rows }) =>
            rows.length === 0 ? null : (
              <div key={t} className="k-stack g2" aria-label={TABS[t].label}>
                <span className="k-cap">{TABS[t].label}</span>
                {rows.map((r) => (
                  <Box key={r.key} density="row" rail={false} entry={row(t, r, "")} />
                ))}
              </div>
            ),
          )}
        {query.trim() !== "" && found.every((f) => f.rows.length === 0) && (
          <p className="k-help">
            Nessun risultato.{" "}
            <a
              className="k-link"
              href={"/cibo/cibo/nuovo?nome=" + encodeURIComponent(query.trim())}
            >
              Crea il cibo «{query.trim()}»
            </a>
          </p>
        )}
      </section>
      {query.trim() === "" && (
        <>
          <section className="k-section g2" aria-label="I cataloghi">
            <h2>I cataloghi</h2>
            {(Object.keys(TABS) as Tab[]).map((t) => (
              <Box
                key={t}
                density="row"
                rail={false}
                entry={{
                  ...SHELF_OF[t],
                  of: { kind: SHELF_OF[t].kind },
                  title: TABS[t].label,
                  value: F.n(lists[t].length, 0),
                  meta: shelfLines[t],
                  href: LIST_HREF[t],
                  hrefLabel: "Apri " + TABS[t].label.toLowerCase(),
                }}
              />
            ))}
            <Box
              density="row"
              rail={false}
              entry={{
                fam: "food",
                of: { kind: "ingredient" },
                title: "Dispensa",
                value: F.n(pantry.count, 0),
                meta: pantry.count
                  ? pantry.toBuy
                    ? F.plural(pantry.toBuy, "da comprare", "da comprare")
                    : "niente da comprare"
                  : "segna cosa compri: quello che mangi lo toglie lei",
                href: "/cibo/elenco?vista=dispensa",
                hrefLabel: "Apri la dispensa",
              }}
            />
            <Box
              density="row"
              rail={false}
              entry={{
                fam: "train",
                of: { kind: "trip" },
                title: "Tragitti",
                value: F.n(routes.count, 0),
                meta: routes.line,
                href: "/corpo/elenco?vista=tragitti",
                hrefLabel: "Apri i tragitti",
              }}
            />
            <Box
              density="row"
              rail={false}
              entry={{
                fam: "settings",
                of: { kind: "types" },
                title: "Tipi di tracker",
                value: F.n(trackers.all, 0),
                meta:
                  "ciò che segni, coi suoi campi · " +
                  (trackers.own > 0
                    ? F.plural(trackers.own, "tuo", "tuoi")
                    : "crea il tuo"),
                href: "/oggi/elenco#tracker",
                hrefLabel: "I tipi di tracker",
              }}
            />
          </section>
          <section className="k-section g2" aria-label="Aggiungere">
            <h2>Aggiungere</h2>
            {ADDS.map((a) => (
              <Box key={a.title} density="row" rail={false} entry={a} />
            ))}
          </section>
        </>
      )}
    </>
  );
}

const ADDS = [
  {
    fam: "food",
    of: { kind: "ingredient" },
    title: "Un cibo",
    meta: "dal codice a barre (Open Food Facts) o a mano, dall’etichetta",
    href: "/cibo/cibo/nuovo",
    hrefLabel: "Aggiungi un cibo",
  },
  {
    fam: "food",
    of: { kind: "recipe" },
    title: "Un pasto",
    meta: "i suoi cibi, o una stima: si salva senza registrarlo",
    href: "/cibo/pasto/nuovo",
    hrefLabel: "Nuovo pasto",
  },
  {
    fam: "habit",
    title: "Un tracker",
    meta: "qualsiasi cosa: un numero, un voto, un segno",
    href: "/oggi/tracker/nuovo",
    hrefLabel: "Crea un tracker",
  },
  {
    fam: "train",
    of: { kind: "exercise" },
    title: "Un esercizio",
    meta: "nome, schema, attrezzo, un lato alla volta",
    href: "/corpo/esercizio/nuovo",
    hrefLabel: "Aggiungi un esercizio",
  },
];

/** One shelf's list: its search, its sort, the sort's number on each row. */
function List({
  lists,
  first,
  alone,
  server,
}: {
  lists: Record<Tab, LibraryRow[]>;
  first: Tab;
  alone: boolean;
  server: VerbServer;
}) {
  const verbs = useObjectVerbs(server);
  const [tab, setTab] = useState<Tab>(first);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("uses");
  const rows = listRows(lists[tab], query, sort);
  const per = tab === "foods" ? "/100" : "";
  const value = (r: LibraryRow) => {
    const s =
      sort === "uses" || sort === "name" ? (tab === "exercises" ? "e1rm" : "kcal") : sort;
    const v = sortValue(r, s);
    return v === null
      ? "—"
      : F.num(v, UNITS[s] ?? "") + (s === "proteinPerKcal" ? "" : per);
  };
  // Each box's actions row (PAT-101): its object's verbs (MOD-20), «Altro» gone.
  const acts = (r: LibraryRow): PlanAction[] => {
    const o = r.obj;
    if (!o) return [];
    const others = lists[tab].flatMap((x) =>
      x.obj && x.key !== r.key ? [{ id: x.obj.id, name: x.name }] : [],
    );
    return verbs.actions({ ...o, title: r.name, others }, o.verbs);
  };
  return (
    <section className="k-section g3" aria-label="Catalogo">
      {!alone && (
        <div className="k-chips">
          {(Object.keys(TABS) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className="k-chip"
              aria-pressed={tab === t}
              onClick={() => {
                setTab(t);
                if (!(TABS[t].sorts as readonly SortKey[]).includes(sort))
                  setSort("uses");
              }}
            >
              {TABS[t].label} · {lists[t].length}
            </button>
          ))}
        </div>
      )}
      {tab === "foods" && (
        <a className="k-btn secondary" href="/cibo/cibo/nuovo">
          + Nuovo cibo
        </a>
      )}
      {tab === "meals" && (
        <a className="k-btn secondary" href="/cibo/pasto/nuovo">
          + Nuovo pasto
        </a>
      )}
      {tab === "exercises" && (
        <a className="k-btn secondary" href="/corpo/esercizio/nuovo">
          + Nuovo esercizio
        </a>
      )}
      <input
        className="k-text"
        type="search"
        placeholder={"Cerca in " + TABS[tab].label.toLowerCase()}
        aria-label="Cerca"
        value={query}
        onChange={(x) => setQuery(x.target.value)}
      />
      <Field
        key={tab}
        name="sort"
        label="Ordina per"
        type="choice"
        required
        defaultValue={sort}
        onChange={(s) => setSort(s as SortKey)}
        options={TABS[tab].sorts.map((value) => ({ value, label: SORTS[value] }))}
      />
      {rows.length === 0 ? (
        <p className="k-help">
          {query ? "Nessun risultato con queste parole." : "Ancora niente qui."}
        </p>
      ) : (
        // 8 rows, then «Mostra altri (n)» (UI-41, UI-100); a new search or sort starts closed.
        // Past 8 rows the rest stand on one line naming each, opening in place (PAT-40, his 19 Nov).
        <KitList
          key={tab + sort + query}
          label={TABS[tab].label}
          names={rows.map((r) => r.name)}
          remember={"elenco." + tab}
        >
          {rows.map((r) =>
            r.meal ? (
              // A pasto opens in place (PAT-43): the one meal box; its page from the doors' row.
              <MealBox
                key={r.key}
                density="row"
                entry={row(tab, r, value(r))}
                data={r.meal.data}
                slots={mealSlots({
                  data: r.meal.data,
                  rows: partRows(r.meal.parts),
                  details: r.meal.details,
                })}
                actions={[
                  {
                    key: "log",
                    label: w.log,
                    href: "/aggiungi/pasto?pasto=" + r.meal.id,
                  },
                  {
                    key: "compose",
                    label: r.meal.estimate ? w.composeEstimate : w.compose,
                    href: "/cibo/pasto/" + r.meal.id + "/componi",
                  },
                  ...acts(r),
                ]}
              />
            ) : r.exercise ? (
              // An esercizio opens in place (PAT-30 level 1, Deliver ③): facts, e1RM trend.
              <ExercisePlanBox
                key={r.key}
                r={{ ...r, exercise: r.exercise }}
                entry={row(tab, r, value(r))}
                actions={acts(r)}
              />
            ) : r.food ? (
              // A cibo opens in place too (PAT-30 level 1, Deliver ③); its marche redraw it (§130).
              <FoodPlanBox
                key={r.key}
                r={{ ...r, food: r.food }}
                entry={row(tab, r, value(r), !r.products)}
                value={(values) => value({ ...r, values })}
                actions={acts(r)}
              />
            ) : (
              <Box key={r.key} density="row" rail={false} entry={row(tab, r, value(r))} />
            ),
          )}
        </KitList>
      )}
      {verbs.sheet}
      {verbs.toast}
    </section>
  );
}
