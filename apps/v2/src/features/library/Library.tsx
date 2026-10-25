"use client";
/**
 * Libreria (V-07; the board: an index). With no view: one search across
 * every catalog (results as you type, find.md §6), the shelves (foods, saved
 * meals, exercises: counts and a line each) and «Aggiungere». A shelf opens
 * its list (`?vista=`): an instant search and a sort by use, name or a
 * nutrient (alone or per 100 kcal); each row shows the sort's number.
 * Pantry and tracker kinds join the shelves with their slices.
 */
import { useState } from "react";
import { Box, F, Field } from "@lifeos/kit";
import { listRows, sortValue, SORTS, type LibraryRow, type SortKey } from "./library";

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
const VIEW_OF: Record<Tab, string> = {
  foods: "cibi",
  meals: "pasti",
  exercises: "esercizi",
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
}: {
  /** The kinds one can enter, and how many are the person's own («Tipi di tracker»). */
  trackers: { all: number; own: number };
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
    return <Index lists={lists} shelfLines={shelfLines} trackers={trackers} />;
  return <List lists={lists} first={view} />;
}

function row(tab: Tab, r: LibraryRow, value: string) {
  return {
    ...SHELF_OF[tab],
    of: tab === "meals" ? { kind: "meal" } : (r.of ?? {}),
    title: r.name,
    ...(r.sub ? { meta: r.sub } : {}),
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
}: {
  lists: Record<Tab, LibraryRow[]>;
  shelfLines: Record<Tab, string>;
  trackers: { all: number; own: number };
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
              href={"/libreria/cibo/nuovo?nome=" + encodeURIComponent(query.trim())}
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
                  href: "/libreria?vista=" + VIEW_OF[t],
                  hrefLabel: "Apri " + TABS[t].label.toLowerCase(),
                }}
              />
            ))}
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
                href: "/impostazioni/tipi",
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
    href: "/libreria/cibo/nuovo",
    hrefLabel: "Aggiungi un cibo",
  },
  {
    fam: "food",
    of: { kind: "recipe" },
    title: "Un pasto",
    meta: "componilo e «Salva anche come pasto»",
    href: "/aggiungi/pasto",
    hrefLabel: "Componi un pasto",
  },
  {
    fam: "habit",
    title: "Un tracker",
    meta: "qualsiasi cosa: un numero, un voto, un segno",
    href: "/impostazioni/tipi#nuovo",
    hrefLabel: "Crea un tracker",
  },
  {
    fam: "train",
    of: { kind: "exercise" },
    title: "Un esercizio",
    meta: "nome, schema, attrezzo, un lato alla volta",
    href: "/libreria/esercizio/nuovo",
    hrefLabel: "Aggiungi un esercizio",
  },
];

/** One shelf's list: its search, its sort, the sort's number on each row. */
function List({ lists, first }: { lists: Record<Tab, LibraryRow[]>; first: Tab }) {
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
  return (
    <section className="k-section g3" aria-label="Catalogo">
      <div className="k-chips">
        {(Object.keys(TABS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className="k-chip"
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              if (!(TABS[t].sorts as readonly SortKey[]).includes(sort)) setSort("uses");
            }}
          >
            {TABS[t].label} · {lists[t].length}
          </button>
        ))}
      </div>
      {tab === "foods" && (
        <a className="k-btn secondary" href="/libreria/cibo/nuovo">
          + Nuovo cibo
        </a>
      )}
      {tab === "exercises" && (
        <a className="k-btn secondary" href="/libreria/esercizio/nuovo">
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
      <div className="k-stack g2" aria-label={TABS[tab].label}>
        {rows.map((r) => (
          <Box key={r.key} density="row" rail={false} entry={row(tab, r, value(r))} />
        ))}
        {rows.length === 0 && (
          <p className="k-help">
            {query ? "Nessun risultato con queste parole." : "Ancora niente qui."}
          </p>
        )}
      </div>
    </section>
  );
}
