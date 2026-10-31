/**
 * ⊕ Aggiungi (V-02; capture.md §5–§6): one search on top (features/add),
 * «Adesso · Previsto · Prima», then at most eight ranked rows
 * (features/add/rank): today's planned items not done (one tap: done, at the
 * tick's time), what is usual at this hour, the routines most trained (start
 * now), the kinds of the last seven days (water in one tap), the last meals.
 * «Tutti i tipi» folds every door, grouped by family; «La ricerca non
 * trova?»: a new food, exercise or tracker.
 */
import { Box, F, type BoxEntry } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDays } from "@/core/day";
import { addDays, localParts } from "@/core/engines/time";
import { readCatalogNames } from "@/core/catalog/names";
import { readUsualMeals, usualAt } from "@/core/food/usual";
import { readExercises, readRoutines } from "@/core/training";
import { startGym } from "../palestra/actions";
import { kindRows } from "@/features/day/entry-form";
import { isRunning, present } from "@/features/day/present";
import {
  groupKinds,
  nearNow,
  rankAdd,
  type AddAct,
  type AddCandidate,
} from "@/features/add/rank";
import { tickPlanned, waterNow } from "./rank-actions";
import { AddSearch } from "@/features/add/AddSearch";
import type { AddTarget } from "@/features/add/search";
import { addContext } from "./kinds";
import { AREA_HREF, AREA_NAME, areaOfFam, isDomainArea } from "@/features/places";

/** How many recent meals ⊕ offers to register again, from the last three days. */
const RECENT = 4;

export default async function AddPage({
  searchParams,
}: {
  /** `area=`: ⊕ opened from Corpo, Cibo, Mente or Soldi offers that area's kinds first (ADR-0059). */
  searchParams: Promise<{
    giorno?: string | string[];
    stato?: string | string[];
    area?: string | string[];
  }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const asked = await searchParams;
  const { kinds, day, today, clock, roleBounds } = await addContext(
    db,
    owner,
    asked.giorno,
  );
  // «Adesso · Previsto · Prima» (the board Capture): what opens from here is done now,
  // planned, or done earlier with its time to say; carried as `&stato=` to each sheet.
  const when = asked.stato === "previsto" || asked.stato === "prima" ? asked.stato : null;
  const st = when ? "&stato=" + when : "";
  // The last three days, newest first, from one set of queries.
  // The last seven days, newest first, from one set of queries: today's planned
  // items, the kinds logged lately and the last meals feed the ranked rows.
  const days = (
    await loadDays(db, owner, addDays(today, -6), today, { clock, roleBounds })
  ).reverse();
  const recent = days
    .slice(0, 3)
    .flatMap((d) =>
      [...d.timed]
        .reverse()
        .concat(d.untimed)
        .filter(
          (i) =>
            (i.kind.key === "meal" || i.kind.key === "intake") &&
            i.status === "done" &&
            i.lines.length > 0,
        ),
    )
    .slice(0, RECENT);
  const area =
    typeof asked.area === "string" && isDomainArea(asked.area) ? asked.area : null;
  const home = area ? AREA_HREF[area] : "/oggi";
  const back = day === today ? home : home + "/" + day;
  // Today only: what is usual around now, and the routines to start now.
  const now = localParts(new Date(), clock.timeZone).minute;
  const [usual, routines] =
    day === today
      ? await Promise.all([
          readUsualMeals(db, owner, addDays(today, -28), addDays(today, -1), clock).then(
            (m) => usualAt(m, now),
          ),
          readExercises(db, owner).then((x) => readRoutines(db, owner, today, x)),
        ])
      : [[], []];
  // One «Sonno» for the night and the nap: a short sleep by day is saved as a nap.
  const rows = kindRows(
    kinds.filter((k) => k.key !== "nap"),
    (k) => `/aggiungi/${k}?giorno=${day}${st}`,
  );
  const meal = `/aggiungi/pasto?giorno=${day}${st}`;
  const targets: AddTarget[] = [
    {
      key: "k:meal",
      title: "Pasto",
      sub: "tipo",
      fam: "food",
      of: { kind: "meal" },
      href: meal,
    },
    {
      key: "k:session",
      title: "Allenamento",
      sub: "tipo",
      fam: "train",
      of: { kind: "session" },
      href: "/palestra",
    },
    {
      key: "k:activity",
      title: "Attività fatta",
      sub: "corsa, bici, cardio",
      fam: "train",
      of: { kind: "session", pattern: "run" },
      href: `/aggiungi/attivita?giorno=${day}`,
    },
    {
      key: "k:movement",
      title: "Spesa",
      sub: "tipo",
      fam: "money",
      of: { kind: "movement" },
      href: `/aggiungi/spesa?giorno=${day}`,
    },
    {
      key: "k:trip",
      title: "Tragitto",
      sub: "tipo",
      fam: "train",
      of: { kind: "trip" },
      href: `/aggiungi/tragitto?giorno=${day}`,
    },
    ...rows.map((r) => ({
      key: "k:" + r.key,
      title: r.entry.title,
      sub: "tipo",
      fam: r.entry.fam,
      ...(r.entry.of ? { of: r.entry.of } : {}),
      href: r.href,
    })),
    ...(await readCatalogNames(db, owner)).map((c) =>
      c.catalog === "food"
        ? {
            key: c.id,
            title: c.name,
            sub: "cibo",
            fam: "food",
            href: meal + "&cibo=" + c.id,
          }
        : c.catalog === "recipe"
          ? {
              key: c.id,
              title: c.name,
              sub: "pasto salvato",
              fam: "food",
              of: { kind: "meal" },
              href: meal + "&pasto=" + c.id,
            }
          : {
              key: c.id,
              title: c.name,
              sub: "allenamento",
              fam: "train",
              of: { kind: "session" },
              href: "/palestra",
            },
    ),
  ];
  // ⊕ ranks (capture.md §5): planned today and not done, usual now, routines, kinds of the week, last meals.
  const isToday = day === today;
  const oneTap = when === null;
  const thisDay = days.find((d) => d.day === day);
  const kindEntry = new Map(rows.map((r) => [r.key, r]));
  const planned: AddCandidate[] = (thisDay ? [...thisDay.timed, ...thisDay.untimed] : [])
    .filter((i) => i.status === "planned" && i.kind.key !== "water" && !isRunning(i))
    .map((i) => {
      const { href: _h, hrefLabel: _l, ...entry } = present(i);
      const act: AddAct =
        i.kind.key === "session"
          ? { type: "open", href: "/palestra/" + i.id }
          : oneTap
            ? { type: "done", id: i.id }
            : { type: "open", href: "/voce/" + i.id };
      return {
        key: "e:" + i.id,
        entry: {
          ...entry,
          meta: [
            i.minute !== null ? "previsto alle " + F.time(i.minute) : "previsto",
            entry.meta,
          ]
            .filter(Boolean)
            .join(" · "),
          value: act.type === "done" ? "Fatto" : "›",
          planned: false,
        },
        act,
        reason: "planned" as const,
        weight: nearNow(i.minute, now),
      };
    });
  const usualRows: AddCandidate[] = usual.map((u) => ({
    key: "u:" + u.label,
    entry: {
      fam: "food",
      of: { kind: "meal" },
      title: u.label,
      meta: u.days + " giorni su 28 a quest’ora",
      value: "+",
    },
    act: { type: "open", href: `/aggiungi/pasto?giorno=${day}&da=${u.lastId}${st}` },
    reason: "usual",
    weight: u.days,
  }));
  const routineRows: AddCandidate[] = routines.slice(0, 2).map((r) => ({
    key: "r:" + r.id,
    entry: {
      fam: "train",
      of: { kind: "session" },
      title: r.name,
      meta:
        F.plural(r.exercises.length, "esercizio", "esercizi") +
        (r.uses ? " · " + r.uses + " volte in 90 giorni" : "") +
        " · inizia adesso",
      value: "›",
    },
    act: { type: "gym", routineId: r.id },
    reason: "routine",
    weight: r.uses,
  }));
  const used = new Map<string, number>();
  for (const d of days)
    for (const i of [...d.timed, ...d.untimed])
      if (kindEntry.has(i.kind.key))
        used.set(i.kind.key, (used.get(i.kind.key) ?? 0) + 1);
  const kindRowsUsed: AddCandidate[] = [...used].map(([key, n]) => ({
    key: "k:" + key,
    entry: {
      ...kindEntry.get(key)!.entry,
      meta: F.plural(n, "volta", "volte") + " in 7 giorni",
      value: key === "water" && oneTap ? "+500 ml" : "›",
    },
    act:
      key === "water" && oneTap
        ? { type: "water", ml: 500 }
        : { type: "open", href: kindEntry.get(key)!.href },
    reason: "kind",
    weight: n,
  }));
  const recentRows: AddCandidate[] = recent.map((i, n) => {
    const { href: _h, hrefLabel: _l, ...entry } = present(i);
    return {
      key: "m:" + i.id,
      entry: { ...entry, value: "+" },
      act: {
        type: "open",
        href:
          `/aggiungi/pasto?giorno=${day}&da=${i.id}${st}` +
          (i.kind.key === "intake" ? "&per=assunzione" : ""),
      },
      reason: "recent",
      weight: -n,
    };
  });
  const candidates = [
    ...planned,
    ...usualRows,
    ...(oneTap ? routineRows : []),
    ...kindRowsUsed,
    ...recentRows,
  ];
  // From an area: its own kinds only, when it has any lately (else everything).
  const mine = area
    ? candidates.filter((c) => areaOfFam(c.entry.fam ?? "") === area)
    : candidates;
  const ranked = rankAdd(mine.length > 0 ? mine : candidates);
  // «Tutti i tipi»: the doors with no value of their own, then every kind, grouped.
  const doors: { key: string; href: string; entry: BoxEntry }[] = [
    {
      key: "meal",
      href: meal,
      entry: { fam: "food", of: { kind: "meal" }, title: "Pasto" },
    },
    {
      key: "intake",
      href: meal + "&per=assunzione",
      entry: {
        fam: "food",
        of: { kind: "meal" },
        title: "Assunzione",
        meta: "caffè, creatina, integratori",
      },
    },
    {
      key: "session",
      href: "/palestra",
      entry: { fam: "train", of: { kind: "session" }, title: "Allenamento" },
    },
    {
      key: "activity",
      href: `/aggiungi/attivita?giorno=${day}`,
      entry: {
        fam: "train",
        of: { kind: "session", pattern: "run" },
        title: "Attività fatta",
        meta: "corsa, bici, cardio: già fatta",
      },
    },
    {
      key: "trip",
      href: `/aggiungi/tragitto?giorno=${day}`,
      entry: { fam: "train", of: { kind: "trip" }, title: "Tragitto" },
    },
    {
      key: "movement",
      href: `/aggiungi/spesa?giorno=${day}`,
      entry: { fam: "money", of: { kind: "movement" }, title: "Spesa" },
    },
    ...rows.map((r) => ({ key: r.key, href: r.href, entry: r.entry })),
  ];
  const ofArea = (rows: readonly { entry: BoxEntry }[]) =>
    area !== null && rows.some((r) => areaOfFam(r.entry.fam ?? "") === area);
  // «Tutti i tipi»: the area's group first (stable sort keeps the rest in order).
  const groups = groupKinds(doors).sort(
    (a, b) => Number(ofArea(b.rows)) - Number(ofArea(a.rows)),
  );
  const row = (c: AddCandidate) =>
    c.act.type === "open" ? (
      <a key={c.key} href={c.act.href} className="k-plain">
        <Box entry={c.entry} density="row" rail={false} />
      </a>
    ) : (
      <form
        key={c.key}
        action={
          c.act.type === "done"
            ? tickPlanned.bind(null, c.act.id, day, isToday)
            : c.act.type === "water"
              ? waterNow.bind(null, day, c.act.ml, isToday)
              : startGym.bind(null, c.act.routineId)
        }
      >
        <button type="submit" className="k-pick">
          <Box entry={c.entry} density="row" rail={false} />
        </button>
      </form>
    );
  return (
    <div className="k-sheet-wrap k-screen">
      <a className="k-dim" href={back} aria-label="Chiudi" />
      <section className="k-sheet" role="dialog" aria-label="Aggiungi">
        <span className="handle" />
        <div className="k-sh">
          <h2>Aggiungi</h2>
          <span className="k-meta">
            {(day === today ? "oggi" : F.Day(day)) +
              (area ? " · " + AREA_NAME[area] : "")}
          </span>
        </div>
        <div className="k-sbody">
          <AddSearch targets={targets}>
            <section className="k-section" aria-label="Quando">
              <nav className="k-choice" aria-label="Quando">
                {(
                  [
                    [null, "Adesso"],
                    ["previsto", "Previsto"],
                    ["prima", "Prima"],
                  ] as const
                ).map(([k, label]) => (
                  <a
                    key={label}
                    href={`/aggiungi?giorno=${day}` + (k ? "&stato=" + k : "")}
                    aria-current={k === when ? "true" : undefined}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </section>
            {ranked.length > 0 && (
              <section className="k-section" aria-label="Per te">
                <h2>
                  {when === null
                    ? "Per te"
                    : when === "previsto"
                      ? "Da prevedere"
                      : "Già fatto"}{" "}
                  <span className="k-meta">{isToday ? F.time(now) : F.Day(day)}</span>
                </h2>
                <div className="k-stack g2">{ranked.map(row)}</div>
              </section>
            )}
            <details className="k-section k-fold" open={ranked.length === 0}>
              <summary>
                Tutti i tipi <span className="k-meta">{doors.length}</span>
              </summary>
              <div className="k-foldbody">
                {groups.map((g) => (
                  <div key={g.name} className="k-stack g2">
                    <h3 className="k-label">{g.name}</h3>
                    <div className="k-grid">
                      {g.rows.map((r) => (
                        <a key={r.key} href={r.href} className="k-plain">
                          <Box entry={r.entry} density="row" rail={false} />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
            <section className="k-section" aria-label="Non trovi">
              <h2>La ricerca non trova?</h2>
              <div className="k-stack g2">
                <a
                  href={
                    "/libreria/cibo/nuovo?torna=" +
                    encodeURIComponent("/aggiungi/pasto?giorno=" + day)
                  }
                  className="k-plain"
                >
                  <Box
                    density="row"
                    rail={false}
                    entry={{
                      fam: "food",
                      title: "Nuovo cibo",
                      meta: "a mano, dall’etichetta",
                      value: "›",
                    }}
                  />
                </a>
                <a href="/libreria/esercizio/nuovo" className="k-plain">
                  <Box
                    density="row"
                    rail={false}
                    entry={{ fam: "train", title: "Nuovo esercizio", value: "›" }}
                  />
                </a>
                <a href="/impostazioni/tipi#nuovo" className="k-plain">
                  <Box
                    density="row"
                    rail={false}
                    entry={{
                      fam: "habit",
                      title: "Nuovo tracker",
                      meta: "qualsiasi cosa: un numero, un voto, un segno",
                      value: "›",
                    }}
                  />
                </a>
              </div>
            </section>
          </AddSearch>
        </div>
        <div className="foot">
          <a className="k-btn secondary k-grow" href={back}>
            Chiudi
          </a>
        </div>
      </section>
    </div>
  );
}
