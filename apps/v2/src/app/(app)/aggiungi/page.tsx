/**
 * ⊕ Aggiungi (V-02; the board Capture): today, «A quest'ora, di solito»
 * (what is usually logged around now, core/food `usualAt`) and
 * «Allenamento, come l'ultima volta» (the routines most trained, started
 * in one tap); «Di nuovo»: the last meals, each opening the composer with
 * its foods; «Cosa», the meal composer and the kinds this person can
 * enter, each opening its sheet for the day it came from; «La ricerca non
 * trova?»: a new food or exercise. On top, one search across the kinds,
 * foods, saved meals and routines (features/add); «Cosa» first, as on the
 * board. The «Adesso · Previsto · Prima» switch comes later.
 */
import { Box, F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDays } from "@/core/day";
import { addDays, localParts } from "@/core/engines/time";
import { readCatalogNames } from "@/core/catalog/names";
import { readUsualMeals, usualAt } from "@/core/food/usual";
import { readExercises, readRoutines } from "@/core/training";
import { startGym } from "../palestra/actions";
import { kindRows } from "@/features/day/entry-form";
import { present } from "@/features/day/present";
import { AddSearch } from "@/features/add/AddSearch";
import type { AddTarget } from "@/features/add/search";
import { addContext } from "./kinds";

/** How many recent meals ⊕ offers to register again, from the last three days. */
const RECENT = 4;

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ giorno?: string | string[]; stato?: string | string[] }>;
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
  const recent = (
    await loadDays(db, owner, addDays(today, -2), today, { clock, roleBounds })
  )
    .reverse()
    .flatMap((d) =>
      [...d.timed]
        .reverse()
        .concat(d.untimed)
        .filter(
          (i) => i.kind.key === "meal" && i.status === "done" && i.lines.length > 0,
        ),
    )
    .slice(0, RECENT);
  const back = day === today ? "/oggi" : "/oggi/" + day;
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
  const rows = kindRows(kinds, (k) => `/aggiungi/${k}?giorno=${day}${st}`);
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
  return (
    <div className="k-sheet-wrap k-screen">
      <a className="k-dim" href={back} aria-label="Chiudi" />
      <section className="k-sheet" role="dialog" aria-label="Aggiungi">
        <span className="handle" />
        <div className="k-sh">
          <h2>Aggiungi</h2>
          <span className="k-meta">{day === today ? "oggi" : F.Day(day)}</span>
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
            <section className="k-section" aria-label="Cosa aggiungere">
              <h2>Cosa</h2>
              <div className="k-grid">
                <a href={meal} className="k-plain">
                  <Box
                    entry={{ fam: "food", of: { kind: "meal" }, title: "Pasto" }}
                    density="row"
                    rail={false}
                  />
                </a>
                <a href="/palestra" className="k-plain">
                  <Box
                    entry={{
                      fam: "train",
                      of: { kind: "session" },
                      title: "Allenamento",
                    }}
                    density="row"
                    rail={false}
                  />
                </a>
                <a href={`/aggiungi/attivita?giorno=${day}`} className="k-plain">
                  <Box
                    entry={{
                      fam: "train",
                      of: { kind: "session", pattern: "run" },
                      title: "Attività fatta",
                      meta: "corsa, bici, cardio: già fatta",
                    }}
                    density="row"
                    rail={false}
                  />
                </a>
                <a href={`/aggiungi/spesa?giorno=${day}`} className="k-plain">
                  <Box
                    entry={{ fam: "money", of: { kind: "movement" }, title: "Spesa" }}
                    density="row"
                    rail={false}
                  />
                </a>
                <a href={`/aggiungi/tragitto?giorno=${day}`} className="k-plain">
                  <Box
                    entry={{ fam: "train", of: { kind: "trip" }, title: "Tragitto" }}
                    density="row"
                    rail={false}
                  />
                </a>
                {rows.map((r) => (
                  <a key={r.key} href={r.href} className="k-plain">
                    <Box entry={r.entry} density="row" rail={false} />
                  </a>
                ))}
              </div>
            </section>
            {usual.length > 0 && (
              <section className="k-section" aria-label="A quest'ora, di solito">
                <h2>
                  A quest’ora, di solito <span className="k-meta">{F.time(now)}</span>
                </h2>
                <div className="k-stack g2">
                  {usual.map((u) => (
                    <a
                      key={u.lastId}
                      href={`/aggiungi/pasto?giorno=${day}&da=${u.lastId}${st}`}
                      className="k-plain"
                    >
                      <Box
                        density="row"
                        rail={false}
                        entry={{
                          fam: "food",
                          of: { kind: "meal" },
                          title: u.label,
                          meta: u.days + " giorni su 28 · l’ultima " + F.date(u.lastDay),
                          value: "+",
                        }}
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}
            {routines.length > 0 && (
              <section className="k-section" aria-label="Allenamento">
                <h2>
                  Allenamento <span className="k-meta">inizia adesso</span>
                </h2>
                <div className="k-stack g2">
                  {routines.slice(0, 3).map((r) => (
                    <form key={r.id} action={startGym.bind(null, r.id)}>
                      <button type="submit" className="k-pick">
                        <Box
                          density="row"
                          rail={false}
                          entry={{
                            fam: "train",
                            of: { kind: "session" },
                            title: r.name,
                            meta:
                              F.plural(r.exercises.length, "esercizio", "esercizi") +
                              (r.uses ? " · " + r.uses + " volte in 90 giorni" : ""),
                            value: "›",
                          }}
                        />
                      </button>
                    </form>
                  ))}
                </div>
              </section>
            )}
            {recent.length > 0 && (
              <section className="k-section" aria-label="Pasti recenti">
                <h2>Di nuovo</h2>
                <div className="k-stack g2">
                  {recent.map((i) => {
                    // The row opens the composer; the timeline's own link would nest.
                    const { href: _href, hrefLabel: _label, ...entry } = present(i);
                    return (
                      <a
                        key={i.id}
                        href={`/aggiungi/pasto?giorno=${day}&da=${i.id}${st}`}
                        className="k-plain"
                      >
                        <Box
                          entry={{ ...entry, value: "+" }}
                          density="row"
                          rail={false}
                        />
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
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
