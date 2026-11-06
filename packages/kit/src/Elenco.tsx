"use client";
/**
 * Elenco (PAT-43, PAT-19, PAT-11, PAT-40): an area's list of the things he reuses — one `List`
 * section per type of the area (title, count, rows that open the object page, «+ Nuovo …» as
 * the last row), the «Attivi · Archiviati» chips (an archived row opens its page, where
 * «Ripristina» is), and the «Possibili doppioni» hint when the one detector finds some. The kit
 * knows no type: sections, words and addresses come from the caller.
 */
import { Glyph } from "./Glyph";
import { List } from "./List";
import { WORDS } from "./words";

export type ElencoRow = { id: string; name: string; meta?: string; href: string };
export type ElencoSection = {
  key: string;
  title: string;
  rows: readonly ElencoRow[];
  /** «+ Nuovo tragitto», «+ Nuova categoria»: the type's own words. */
  add?: { label: string; href: string };
  /** Said when the section has no row («Nessun tragitto archiviato»). */
  empty: string;
};

export function Elenco({
  sections,
  archived,
  filterHref,
  twins,
}: {
  sections: readonly ElencoSection[];
  /** Showing the archived ones. */
  archived: boolean;
  /** The two chips' addresses. */
  filterHref: { active: string; archived: string };
  /** How many pairs the detector found, and where they are shown. */
  twins?: { count: number; href: string } | null;
}) {
  return (
    <div className="k-stack g3 k-elenco">
      <nav
        className="k-chips"
        aria-label={WORDS.elenco.active + " · " + WORDS.elenco.archived}
      >
        <a
          className={"k-chip" + (archived ? "" : " on")}
          href={filterHref.active}
          aria-current={archived ? undefined : "page"}
        >
          {WORDS.elenco.active}
        </a>
        <a
          className={"k-chip" + (archived ? " on" : "")}
          href={filterHref.archived}
          aria-current={archived ? "page" : undefined}
        >
          {WORDS.elenco.archived}
        </a>
      </nav>
      {twins && twins.count > 0 && !archived && (
        <a className="k-banner k-elencotwins" href={twins.href}>
          <span>{WORDS.elenco.twins(twins.count)}</span>
          <span className="k-btn link">{WORDS.elenco.see}</span>
        </a>
      )}
      {sections.map((s) => (
        <section key={s.key} id={s.key} className="k-section g2" aria-label={s.title}>
          <h2>
            {s.title} <span className="k-meta">{s.rows.length}</span>
          </h2>
          {s.rows.length === 0 && <p className="k-meta">{s.empty}</p>}
          <List label={s.title}>
            {[
              ...s.rows.map((r) => (
                <a key={r.id} className="k-findrow" href={r.href}>
                  <span className="k-title">{r.name}</span>
                  {r.meta && <span className="k-meta">{r.meta}</span>}
                </a>
              )),
              ...(s.add && !archived
                ? [
                    <a key="+" className="k-findrow add" href={s.add.href}>
                      <Glyph of={{ ui: "add" }} decorative />
                      <span className="k-title">{s.add.label}</span>
                    </a>,
                  ]
                : []),
            ]}
          </List>
        </section>
      ))}
    </div>
  );
}
