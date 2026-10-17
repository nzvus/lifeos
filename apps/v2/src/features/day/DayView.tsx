"use client";
/**
 * The day's items under Oggi's filters (find.md §4): the domain chips (the
 * boards' icons) and the state chips, each with its count, «Azzera» when
 * any is on; then the timeline and the untimed items, both filtered. The
 * choice is remembered in this browser (a convenience: it may be lost).
 *
 * Each row's intent (tick, skip, put back, remove) goes to the server
 * actions the page passes; then one toast for 5 s says what happened, with
 * «Annulla» (content.md §4). A removed row leaves at once and comes back if
 * the server says no.
 */
import { useEffect, useRef, useState } from "react";
import { Glyph, ICONS, type BoxEntry } from "@lifeos/kit";
import { EntryRow, type RowIntent } from "./EntryRow";
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

type Row = BoxEntry & { id: string; status: Status };

export type DayActions = {
  changeStatus: (id: string, status: Status) => Promise<Status | null>;
  removeEntry: (id: string) => Promise<boolean>;
  bringBack: (id: string) => Promise<boolean>;
};
type Toast = { text: string; undo?: () => Promise<unknown> };

const DONE_WORDS: Record<Status, string> = {
  done: "segnato fatto",
  skipped: "saltato",
  planned: "di nuovo tra i previsti",
};
const TOAST_MS = 5000;
const KEY = "lifeos.oggi.filters";
const FAM_ORDER = Object.keys(ICONS.domains);

export function DayView({
  rows: allRows,
  untimed: allUntimed,
  now,
  actions,
}: {
  rows: (Row & { minute: number })[];
  untimed: Row[];
  now: { minute: number; label: string } | null;
  actions: DayActions;
}) {
  const [gone, setGone] = useState<ReadonlySet<string>>(new Set());
  const rows = allRows.filter((r) => !gone.has(r.id));
  const untimed = allUntimed.filter((r) => !gone.has(r.id));
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const say = (t: Toast) => {
    clearTimeout(timer.current);
    setToast(t);
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  };
  const failed = () => say({ text: "Non è stato salvato. Riprova." });
  const hide = (id: string, on: boolean) =>
    setGone((g) => {
      const next = new Set(g);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const act = async (r: Row, intent: RowIntent) => {
    try {
      if (intent === "remove") {
        hide(r.id, true);
        if (!(await actions.removeEntry(r.id))) {
          hide(r.id, false);
          failed();
          return;
        }
        say({
          text: "«" + r.title + "» eliminato",
          undo: async () => {
            if (await actions.bringBack(r.id)) hide(r.id, false);
          },
        });
        return;
      }
      const before = await actions.changeStatus(r.id, intent);
      if (before === null) return failed();
      say({
        text: "«" + r.title + "» " + DONE_WORDS[intent],
        undo: () => actions.changeStatus(r.id, before),
      });
    } catch {
      if (intent === "remove") hide(r.id, false);
      failed();
    }
  };
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
          {shown.length > 0 && (
            <Timeline
              rows={shown}
              now={now}
              row={(r, mode, onRail) => (
                <EntryRow
                  entry={r}
                  status={r.status}
                  mode={mode}
                  onRail={onRail}
                  onIntent={(i) => act(r, i)}
                />
              )}
            />
          )}
          {shownUntimed.length > 0 && (
            <section className="k-section g3" aria-label="Senza orario">
              <h2 className="k-cap">Senza orario</h2>
              {shownUntimed.map((e) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  status={e.status}
                  density="row"
                  rail={false}
                  onIntent={(i) => act(e, i)}
                />
              ))}
            </section>
          )}
        </>
      )}
      {toast && (
        <div className="k-toastbar">
          <div className="k-toast" role="status">
            <span>{toast.text}</span>
            {toast.undo && (
              <button
                type="button"
                className="k-btn link"
                onClick={async () => {
                  const undo = toast.undo!;
                  setToast(null);
                  try {
                    await undo();
                  } catch {
                    failed();
                  }
                }}
              >
                Annulla
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
