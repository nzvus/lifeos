"use client";
/**
 * Libreria (V-07), first part: foods and saved meals, an instant search and
 * a sort by use, name or a nutrient (alone or per 100 kcal); each row shows
 * the sort's number. Opening an item, editing and "+" come with the editors.
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
    sorts: ["uses", "name", "kcal", "protein", "proteinPerKcal", "fibre"],
  },
  meals: {
    label: "Pasti salvati",
    sorts: ["uses", "name", "kcal", "protein", "proteinPerKcal", "fibre"],
  },
  exercises: { label: "Esercizi", sorts: ["uses", "name", "e1rm"] },
} as const satisfies Record<string, { label: string; sorts: readonly SortKey[] }>;
type Tab = keyof typeof TABS;

export function Library({
  foods,
  meals,
  exercises,
}: {
  foods: LibraryRow[];
  meals: LibraryRow[];
  exercises: LibraryRow[];
}) {
  const lists: Record<Tab, LibraryRow[]> = { foods, meals, exercises };
  const [tab, setTab] = useState<Tab>("foods");
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
          <Box
            key={r.key}
            density="row"
            rail={false}
            entry={{
              fam: "food",
              ...(tab === "meals" ? { of: { kind: "meal" } } : {}),
              ...(tab === "exercises" ? { fam: "train" as const } : {}),
              title: r.name,
              ...(r.sub ? { meta: r.sub } : {}),
              value: value(r),
              ...(r.href ? { href: r.href } : {}),
            }}
          />
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
