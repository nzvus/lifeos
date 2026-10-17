"use client";
/**
 * The day's items under Oggi's filters (find.md §4): the domain chips (the
 * boards' icons) and the state chips, each with its count, «Azzera» when
 * any is on; then the timeline and the untimed items, both filtered. The
 * choice is remembered in this browser (a convenience: it may be lost).
 */
import { useEffect, useState } from "react";
import { Box, Glyph, ICONS, type BoxEntry } from "@lifeos/kit";
import {
  NONE,
  STATUS_LABEL,
  facets,
  matches,
  restore,
  toggle,
  type Facet,
  type Selection,
  type Status,
} from "./filter";
import { Timeline } from "./Timeline";

type Row = BoxEntry & { status: Status };
const KEY = "lifeos.oggi.filters";
const FAM_ORDER = Object.keys(ICONS.domains);

export function DayView({
  rows,
  untimed,
  now,
}: {
  rows: (Row & { minute: number })[];
  untimed: Row[];
  now: { minute: number; label: string } | null;
}) {
  const all = [...rows, ...untimed];
  const offered = facets(all, FAM_ORDER);
  const [sel, setSel] = useState<Selection>(NONE);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // The browser's memory exists only after hydration.
      if (saved) setSel(restore(JSON.parse(saved), offered));
    } catch {
      // No storage (private window, blocked): start with nothing chosen.
    }
    // Once per day page: `offered` comes from the server's rows.
  }, []);
  const choose = (facet: Facet, value: string) => {
    const next = toggle(sel, facet, value);
    setSel(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Not remembered; the filter still works.
    }
  };
  const active = sel.fam.length + sel.status.length > 0;
  const shown = rows.filter((r) => matches(r, sel));
  const shownUntimed = untimed.filter((r) => matches(r, sel));
  const chips = offered.fam.length + offered.status.length > 0;

  return (
    <>
      {chips && (
        <nav className="k-chips" aria-label="Filtra la giornata">
          {offered.fam.map((f) => {
            const label = ICONS.domains[f.value]?.label ?? f.value;
            return (
              <button
                key={f.value}
                type="button"
                className="k-chip"
                aria-pressed={sel.fam.includes(f.value)}
                aria-label={label + ", " + f.count}
                onClick={() => choose("fam", f.value)}
              >
                <Glyph of={{ fam: f.value }} size="s" />
                <span className="k-meta">{f.count}</span>
              </button>
            );
          })}
          {offered.status.map((s) => (
            <button
              key={s.value}
              type="button"
              className="k-chip"
              aria-pressed={sel.status.includes(s.value)}
              onClick={() => choose("status", s.value)}
            >
              {STATUS_LABEL[s.value as Status]}
              <span className="k-meta">{s.count}</span>
            </button>
          ))}
          {active && (
            <button
              type="button"
              className="k-chip"
              onClick={() => {
                setSel(NONE);
                try {
                  localStorage.removeItem(KEY);
                } catch {
                  // Nothing remembered to clear.
                }
              }}
            >
              Azzera
            </button>
          )}
        </nav>
      )}
      {shown.length === 0 && shownUntimed.length === 0 ? (
        <p className="k-empty k-meta">Nessuna voce con questi filtri.</p>
      ) : (
        <>
          {shown.length > 0 && <Timeline rows={shown} now={now} />}
          {shownUntimed.length > 0 && (
            <section className="k-section g3" aria-label="Senza orario">
              <h2 className="k-cap">Senza orario</h2>
              {shownUntimed.map((e, i) => (
                <Box key={i} entry={e} density="row" rail={false} />
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
