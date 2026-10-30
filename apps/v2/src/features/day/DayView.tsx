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
import {
  Box,
  F,
  Glyph,
  ICONS,
  Nutrients,
  NutrientsL0,
  type BoxEntry,
  type NutrientsData,
} from "@lifeos/kit";
import type { ModelRow } from "./model-items";
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
import { Timeline, type Part } from "./Timeline";
import { mealRoleAt, type RoleBounds } from "@/core/kinds/registry";
import { MEAL_ROLE_WORDS } from "./words";
import { WaterRow, type Water } from "./WaterRow";

type Row = BoxEntry & {
  id: string;
  status: Status;
  l0?: NutrientsData | null;
  /** A session in progress (features/day/present `isRunning`). */
  running?: boolean;
  /** A session: «Inizia» instead of «Fatto». */
  session?: boolean;
  /** Meals of one role together: the entries inside, and where to add one more. */
  group?: (Row & { minute: number })[];
  addHref?: string;
};

export type DayActions = {
  changeStatus: (id: string, status: Status) => Promise<Status | null>;
  removeEntry: (id: string) => Promise<boolean>;
  bringBack: (id: string) => Promise<boolean>;
  /** «Togli i previsti»: answers the ids that went to the trash. */
  removePlanned: (ids: string[]) => Promise<string[]>;
  bringBackAll: (ids: string[]) => Promise<boolean>;
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
  water = null,
  fromModel = [],
  arrived = null,
  clock,
}: {
  rows: (Row & { minute: number })[];
  untimed: Row[];
  now: { minute: number; label: string } | null;
  actions: DayActions;
  /** The day's water, one box in the timeline; its drinks are not rows. */
  water?: Water | null;
  /** What the day's model still plans (model-items): shown with no filter on, each a link. */
  fromModel?: ModelRow[];
  /** An entry ticked done from ⊕ (capture.md §6): its toast, with «Annulla», on arrival. */
  arrived?: { id: string; text: string } | null;
  /** The parts of the day (UI-77): the day, whether it is over, its boundary, the
   *  person's meal-role bounds and the roles already eaten (what a gap offers). */
  clock?: {
    date: string;
    gone: boolean;
    boundaryMin: number;
    roleBounds: RoleBounds;
    roles: string[];
  };
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
  // Once: the toast of what ⊕ ticked, and the address without `?fatto=` (a reload says nothing).
  useEffect(() => {
    if (!arrived) return;
    say({ text: arrived.text, undo: () => actions.changeStatus(arrived.id, "planned") });
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
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
  // Every planned row of the day, filtered or not: the action says how many.
  const plannedIds = [...rows.flatMap((r) => r.group ?? [r]), ...untimed]
    .filter((r) => r.status === "planned")
    .map((r) => r.id);
  const clearPlanned = async () => {
    const ids = plannedIds;
    for (const id of ids) hide(id, true);
    try {
      const gone = await actions.removePlanned(ids);
      for (const id of ids) if (!gone.includes(id)) hide(id, false);
      if (gone.length === 0) return failed();
      say({
        text: gone.length === 1 ? "1 previsto tolto" : gone.length + " previsti tolti",
        undo: async () => {
          if (await actions.bringBackAll(gone)) for (const id of gone) hide(id, false);
        },
      });
    } catch {
      for (const id of ids) hide(id, false);
      failed();
    }
  };
  const waterRow: (Row & { minute: number }) | null = water
    ? { ...water.entry, id: "water", status: "done", minute: water.minute }
    : null;
  const all = [...rows, ...(waterRow ? [waterRow] : []), ...untimed];
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
  const ghosts: (Row & { minute: number })[] = fromModel.map((m) => ({
    ...m,
    status: "planned",
  }));
  const ghostIds = new Set(ghosts.map((g) => g.id));
  const shown = [...rows, ...(waterRow ? [waterRow] : []), ...(active ? [] : ghosts)]
    .filter((r) => ghostIds.has(r.id) || matches(r, sel))
    .sort((a, b) => a.minute - b.minute);
  const shownUntimed = untimed.filter((r) => matches(r, sel));
  // The parts are the person's meal-role bounds, the same that name a meal by its time
  // and that ⊕ offers at that hour (UI-77): a gap offers the meal missing then, else ⊕.
  const parts: Part[] | undefined = clock && [
    { name: "Mattina", from: clock.boundaryMin, to: clock.roleBounds.lunchFrom },
    {
      name: "Mezzogiorno",
      from: clock.roleBounds.lunchFrom,
      to: clock.roleBounds.snackFrom,
    },
    {
      name: "Pomeriggio",
      from: clock.roleBounds.snackFrom,
      to: clock.roleBounds.dinnerFrom,
    },
    { name: "Sera", from: clock.roleBounds.dinnerFrom, to: 1440 },
    { name: "Notte", from: 1440, to: 1440 + clock.boundaryMin },
  ];
  const gap =
    clock &&
    ((from: number, to: number) => {
      const mid = from + Math.round((to - from) / 2);
      const role = mealRoleAt(mid % 1440, clock.roleBounds);
      const st = clock.gone || !now || to <= now.minute ? "prima" : "previsto";
      return clock.roles.includes(role)
        ? { href: `/aggiungi?giorno=${clock.date}&stato=${st}`, what: "+ aggiungi" }
        : {
            href: `/aggiungi/pasto?giorno=${clock.date}&ruolo=${role}&ora=${F.time(mid)}&stato=${st}`,
            what: "+ " + MEAL_ROLE_WORDS[role],
          };
    });
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
              {...(parts && gap && clock
                ? { parts, gap, gone: clock.gone, end: 1440 + clock.boundaryMin }
                : {})}
              row={(r, mode, onRail) =>
                r === waterRow && water ? (
                  <WaterRow water={water} mode={mode} onRail={onRail} />
                ) : r.group ? (
                  <GroupRow
                    row={r}
                    kids={r.group.filter((k) => !gone.has(k.id))}
                    mode={mode}
                    onRail={onRail}
                    onIntent={(k, i) => act(k, i)}
                  />
                ) : ghostIds.has(r.id) ? (
                  <Box entry={r} mode={mode} onRail={onRail} />
                ) : (
                  <EntryRow
                    entry={r}
                    status={r.status}
                    mode={mode}
                    onRail={onRail}
                    onIntent={(i) => act(r, i)}
                  />
                )
              }
            />
          )}
          {shownUntimed.length > 0 && (
            // Below the day's end, aligned with the bands, with no rail (UI-77).
            <section className="k-stack g3 k-untimed" aria-label="Senza orario">
              <span className="k-meta">Senza orario</span>
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
      {plannedIds.length > 0 && (
        <div className="k-line wrap k-railed" aria-label="Azioni sulla giornata">
          <button type="button" className="k-btn secondary" onClick={clearPlanned}>
            Togli i previsti ({plannedIds.length})
          </button>
        </div>
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

/**
 * A role's meals as one box (the developer's pick, 2026-10-25): closed, the
 * whole meal's bars and score; open, its panel (each entry's foods as chips,
 * as the day's), then each entry as a row of its own — open it, change it,
 * delete it —, then «+ Aggiungi a cena».
 */
function GroupRow({
  row,
  kids,
  mode,
  onRail,
  onIntent,
}: {
  row: Row & { minute: number };
  kids: (Row & { minute: number })[];
  mode: "compact" | "times";
  onRail: () => void;
  onIntent: (k: Row, i: RowIntent) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="k-mgroup">
      <Box
        entry={{
          ...row,
          meta: kids.length + " voci" + (row.meta?.replace(/^\d+ voci/, "") ?? ""),
        }}
        mode={mode}
        onRail={onRail}
        expanded={open}
        onToggle={() => setOpen(!open)}
      >
        {row.l0 &&
          (open ? (
            <Nutrients data={row.l0} />
          ) : (
            <div className="k-slot-l0">
              <NutrientsL0 data={row.l0} />
            </div>
          ))}
        {open && (
          <div className="k-stack g2 k-mkids">
            {kids.map((k) => (
              <EntryRow
                key={k.id}
                entry={k}
                status={k.status}
                density="row"
                rail={false}
                onIntent={(i) => onIntent(k, i)}
              />
            ))}
            {row.addHref && (
              <a className="k-link" href={row.addHref}>
                + Aggiungi a {row.title.toLowerCase()}
              </a>
            )}
          </div>
        )}
      </Box>
    </div>
  );
}
