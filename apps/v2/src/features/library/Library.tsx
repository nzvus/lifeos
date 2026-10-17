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
};

export function Library({ foods, meals }: { foods: LibraryRow[]; meals: LibraryRow[] }) {
  const [tab, setTab] = useState<"foods" | "meals">("foods");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("uses");
  const rows = listRows(tab === "foods" ? foods : meals, query, sort);
  const per = tab === "foods" ? "/100" : "";
  const value = (r: LibraryRow) => {
    const s = sort === "uses" || sort === "name" ? "kcal" : sort;
    const v = sortValue(r, s);
    return v === null
      ? "—"
      : F.num(v, UNITS[s] ?? "") + (s === "proteinPerKcal" ? "" : per);
  };
  return (
    <section className="k-section g3" aria-label="Catalogo">
      <div className="k-chips">
        <button
          type="button"
          className="k-chip"
          aria-pressed={tab === "foods"}
          onClick={() => setTab("foods")}
        >
          Cibi · {foods.length}
        </button>
        <button
          type="button"
          className="k-chip"
          aria-pressed={tab === "meals"}
          onClick={() => setTab("meals")}
        >
          Pasti salvati · {meals.length}
        </button>
      </div>
      <input
        className="k-text"
        type="search"
        placeholder={tab === "foods" ? "Cerca un cibo" : "Cerca un pasto"}
        aria-label="Cerca"
        value={query}
        onChange={(x) => setQuery(x.target.value)}
      />
      <Field
        name="sort"
        label="Ordina per"
        type="choice"
        required
        defaultValue={sort}
        onChange={(s) => setSort(s as SortKey)}
        options={Object.entries(SORTS).map(([value, label]) => ({ value, label }))}
      />
      <div className="k-stack g2" aria-label={tab === "foods" ? "Cibi" : "Pasti salvati"}>
        {rows.map((r) => (
          <Box
            key={r.key}
            density="row"
            rail={false}
            entry={{
              fam: "food",
              ...(tab === "meals" ? { of: { kind: "meal" } } : {}),
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
