/**
 * Piano · «Ciclo» (dossiers/day-templates.md slice c; the board
 * CycleEditor): one cycle's steps, what is due today and next (E3, as on
 * Oggi), its rules, and the last two weeks' sessions that counted for it.
 */
import { notFound } from "next/navigation";
import { Box, F, NavBar, PageHeader, type BoxEntry } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, logicalDay } from "@/core/engines/time";
import { readCycleBook, readDayPlans, readSessionKeys } from "@/core/plans";
import { CycleEditor } from "@/features/plan/CycleEditor";
import { AREA_HREF } from "@/features/places";
import { addStepForm, moveStepForm, saveCycleForm } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HISTORY_DAYS = 14;
/** «dal 9 ottobre», «dall’8 ottobre», «dall’11 ottobre». */
const since = (d: string) => {
  const n = Number(d.slice(8));
  return (n === 8 || n === 11 ? "dall’" : "dal ") + F.dateLong(d);
};

export default async function CyclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const [book, plans, done] = await Promise.all([
    readCycleBook(db, owner),
    readDayPlans(db, owner, today, today, today),
    readSessionKeys(db, owner, addDays(today, -HISTORY_DAYS)),
  ]);
  const c = book.cycles.find((x) => x.id === id);
  if (!c) notFound();
  const due = plans.get(today)?.cycles.find((x) => x.cycleId === id) ?? null;
  const stepName = (s: (typeof c.steps)[number]) =>
    s.label || s.items.map((i) => i.name).join(" + ") || "Riposo";
  const steps = c.steps.map((s, i) => {
    const rest = s.items.length === 0;
    const row: BoxEntry = {
      fam: rest ? "day" : "train",
      ...(rest ? {} : { sub: "strength" }),
      title: i + 1 + " · " + stepName(s),
      meta: rest
        ? "riposo: niente da fare"
        : "sessione «" + s.items.map((x) => x.name).join(" + ") + "»",
      ...(due && !due.rest && due.label === stepName(s) ? { value: "oggi" } : {}),
    };
    return { id: s.id, row };
  });
  // The sessions that counted: a routine (or exercise) one of the steps holds.
  const keyStep = new Map(
    c.steps.flatMap((s) => s.items.map((i) => [i.id, stepName(s)] as const)),
  );
  const history: BoxEntry[] = done
    .flatMap((o) => {
      const step = o.keys.map((k) => keyStep.get(k)).find(Boolean);
      return step ? [{ day: o.day, step }] : [];
    })
    .sort((a, b) => b.day.localeCompare(a.day))
    .map((h) => ({
      fam: "train",
      sub: "strength",
      title: h.step,
      time: F.date(h.day),
      value: "fatto",
    }));

  return (
    <main className="k-page has-bd">
      <PageHeader
        title={"Ciclo " + c.name}
        context={
          (c.active ? "attivo" : "in pausa") +
          (c.start ? " " + since(c.start) : "") +
          " · " +
          F.plural(c.steps.length, "passo", "passi") +
          (due
            ? " · oggi " +
              due.label +
              (due.late ? " (in ritardo)" : "") +
              (due.next ? ", poi " + due.next : "")
            : "")
        }
        back={{ label: "Modelli", href: "/piano/modelli" }}
        of={{ fam: "day" }}
      />
      <CycleEditor
        name={c.name}
        start={c.start ?? today}
        active={c.active}
        advance={c.advance}
        onSkip={c.onSkip}
        steps={steps}
        routines={book.routines}
        actions={{
          save: saveCycleForm.bind(null, id),
          add: addStepForm.bind(null, id),
          move: moveStepForm.bind(null, id),
        }}
      />
      <section className="k-section g3" aria-label="Gli ultimi giorni">
        <h2>Gli ultimi {HISTORY_DAYS} giorni</h2>
        {history.length === 0 && (
          <p className="k-empty k-meta">Nessuna sessione di questo ciclo.</p>
        )}
        {history.map((h, i) => (
          <Box key={i} entry={h} density="row" mode="times" />
        ))}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="oggi" hrefs={AREA_HREF} addHref="/aggiungi" />
      </div>
    </main>
  );
}
