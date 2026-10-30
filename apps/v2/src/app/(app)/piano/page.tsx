/**
 * Piano (flows.md §1, V-08; the board Plan): the week holding `?settimana=`
 * (today's when missing), one row per day (features/plan/week-rows): its
 * model and cycle step, what was done or is planned, its kcal. The day in
 * `?giorno=` (today in this week, else none) opens below: its model for this
 * day only, each cycle's step chosen by hand or a rest, «Salta», the entries
 * planned and what the model still plans, «+ previsto». Then «Le regole»:
 * the week type and the cycles, «Modelli».
 */
import { Box, DateNav, F, NavBar, PageHeader, weekOf } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDays, readRangeTargets } from "@/core/day";
import { ensureWeekTargets } from "@/core/energy";
import {
  planTag,
  planWords,
  readCycleBook,
  readDayPlans,
  readModelBook,
  resolveModel,
  toModels,
} from "@/core/plans";
import { logicalDay } from "@/core/engines/time";
import { present } from "@/features/day/present";
import { withCompounds } from "@/features/day/compounds";
import { foodIds } from "@/features/day/nutrients";
import { modelItems } from "@/features/day/model-items";
import { daySlots } from "@/features/day/slots";
import { WEEKDAYS } from "@/features/plan/model-form";
import { dayRow } from "@/features/plan/week-rows";
import { readFoodEstimates } from "@/core/food/catalog";
import { PLACES } from "@/features/places";
import { changeDayModel, skipStep } from "../oggi/[[...day]]/plan-actions";
import { copyYesterday, moveTraining, overrideStep } from "./actions";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function PianoPage({
  searchParams,
}: {
  searchParams: Promise<{ settimana?: string | string[]; giorno?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  const today = logicalDay(new Date(), known.clock);
  const asked = await searchParams;
  const wanted =
    typeof asked.giorno === "string" && ISO.test(asked.giorno) ? asked.giorno : null;
  const week = weekOf(
    wanted ??
      (typeof asked.settimana === "string" && ISO.test(asked.settimana)
        ? asked.settimana
        : today),
  );
  const open = wanted ?? (week.includes(today) ? today : null);
  // The whole week from one set of queries, not seven.
  const [days, plans, book, { cycles }] = await Promise.all([
    loadDays(db, owner, week[0]!, week[6]!, known),
    readDayPlans(db, owner, week[0]!, week[6]!, today),
    readModelBook(db, owner),
    readCycleBook(db, owner),
    // A week begun: its automatic targets, made when missing.
    week[0]! <= today ? ensureWeekTargets(db, owner, week[0]!, known.clock) : null,
  ]);
  // A coffee or creatine planned is drawn as on Oggi («Caffè ≈ 100 mg»), not as grams.
  const [compounds, targets] = await Promise.all([
    readFoodEstimates(db, owner, days.flatMap(foodIds)),
    // Each day's kcal from its model and the week (dossiers/targets.md slice c).
    readRangeTargets(
      db,
      owner,
      week[0]!,
      week[6]!,
      new Map(
        week.map((d) => {
          const m = plans.get(d)?.model;
          return [d, m ? { name: m.name, targets: m.targets } : null] as const;
        }),
      ),
    ),
  ]);
  const ctx = { compounds, doses: [], bed: null, creatineDays: null };
  const models = toModels(book.models, book.rows);
  // The header names the open day's model and cycles (the week's first day when none is open).
  const headPlan = plans.get(open ?? week[0]!);
  const sheet = open ? days.find((d) => d.day === open) : undefined;
  const sheetPlan = open ? plans.get(open) : undefined;
  const items = sheet ? [...sheet.timed, ...sheet.untimed] : [];
  const blocks = sheetPlan?.model
    ? (resolveModel(sheetPlan.model.id, models)?.blocks ?? [])
    : [];
  const fromModel =
    open && open >= today
      ? modelItems({
          day: open,
          blocks,
          items,
          nowMinute: null,
          step: sheetPlan?.cycles.find((c) => !c.rest)?.label ?? null,
          slots: daySlots(blocks, targets.get(open) ?? null),
        })
      : [];
  const stepName = (s: (typeof cycles)[number]["steps"][number]) =>
    s.label || s.items.map((i) => i.name).join(" + ") || "Riposo";
  // «Sposta l'allenamento»: the day's planned session, else the model's training block.
  const plannedSession = items.find(
    (i) => i.kind.key === "session" && i.status === "planned",
  );
  const ghostSession = fromModel.find(
    (m) => m.id.startsWith("model:") && m.fam === "train",
  );
  const due = sheetPlan?.cycles.find((c) => !c.rest);
  const dueRoutine = due
    ? cycles
        .find((c) => c.id === due.cycleId)
        ?.steps.find((st) => stepName(st) === due.label)?.items[0]?.id
    : undefined;
  const sessionAt = plannedSession?.minute ?? ghostSession?.minute ?? null;

  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Piano"
        context={[
          F.week(week[0]!),
          headPlan?.model ? "giornata «" + headPlan.model.name + "»" : "",
          ...(headPlan?.cycles ?? []).map((c) => "ciclo " + c.cycle),
        ]
          .filter(Boolean)
          .join(" · ")}
        action={{ label: "Modelli", href: "/piano/modelli" }}
        of={{ place: "piano" }}
      />
      <section className="k-block g3">
        <DateNav
          mode="week"
          day={open ?? week[0]!}
          today={today}
          hrefBase="/piano?giorno="
          weekBase="/piano?settimana="
          levelKey="piano.settimana"
          tags={Object.fromEntries(week.map((d) => [d, planTag(plans.get(d))]))}
        />
      </section>
      <section className="k-section g3" aria-label="La settimana">
        <h2>
          La settimana <span className="k-meta">tocca un giorno per cambiarlo</span>
        </h2>
        <div className="k-stack g2">
          {days.map((d) => (
            <Box
              key={d.day}
              density="row"
              mode="times"
              entry={dayRow({
                day: d.day,
                today,
                plan: plans.get(d.day),
                sessions: [...d.timed, ...d.untimed]
                  .filter((i) => i.kind.key === "session" && i.status === "done")
                  .map((i) => i.item?.name ?? "Allenamento"),
                planned: [...d.timed, ...d.untimed].filter((i) => i.status === "planned")
                  .length,
                kcal: targets.get(d.day)?.kcal ?? null,
                selected: d.day === open,
              })}
            />
          ))}
        </div>
      </section>

      {open && sheet && (
        <section className="k-section g3" aria-label="Il giorno">
          <h2>{open === today ? "Oggi" : F.Day(open)}</h2>
          <span className="k-meta">{planWords(sheetPlan, open === today)}</span>
          {book.models.some((m) => m.active) && (
            <form action={changeDayModel.bind(null, open)} className="k-line k-panel">
              <select
                className="k-select"
                name="model"
                defaultValue={sheetPlan?.model?.from === "day" ? sheetPlan.model.id : ""}
                aria-label="Giornata tipo di questo giorno"
              >
                <option value="">come la settimana</option>
                {book.models
                  .filter((m) => m.active)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
              <button type="submit" className="k-btn secondary">
                Cambia
              </button>
            </form>
          )}
          {open >= today &&
            (sheetPlan?.cycles ?? []).map((c) => {
              const cycle = cycles.find((x) => x.id === c.cycleId);
              if (!cycle) return null;
              return (
                <div key={c.cycleId} className="k-stack g2">
                  <form
                    action={overrideStep.bind(null, open, c.cycleId)}
                    className="k-line k-panel"
                  >
                    <select
                      className="k-select"
                      name="step"
                      defaultValue=""
                      aria-label={"Passo del ciclo " + cycle.name}
                    >
                      <option value="">{"come da ciclo (" + c.label + ")"}</option>
                      {cycle.steps
                        .filter((s) => s.items.length > 0)
                        .map((s) => (
                          <option key={s.id} value={s.position}>
                            {stepName(s)}
                          </option>
                        ))}
                      <option value="rest">Riposo</option>
                    </select>
                    <button type="submit" className="k-btn secondary">
                      Cambia
                    </button>
                  </form>
                  {!c.rest && (
                    <form action={skipStep.bind(null, open, c.cycleId, !c.skipped)}>
                      <button type="submit" className="k-btn link">
                        {c.skipped
                          ? "Annulla il salto di «" + c.label + "»"
                          : "Salta «" + c.label + "»"}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          <span className="k-help">
            Cambia solo questo giorno: il modello e il ciclo restano come sono.
          </span>
          {items
            .filter((i) => i.status === "planned")
            .map((i) => (
              <Box
                key={i.id}
                density="row"
                rail={false}
                entry={withCompounds(present(i), i, ctx)}
              />
            ))}
          {fromModel.map((m) => (
            <Box key={m.id} density="row" mode="times" entry={m} />
          ))}
          {open >= today && (plannedSession || ghostSession) && (
            <form action={moveTraining.bind(null, open)} className="k-line k-panel">
              <input type="hidden" name="entry" value={plannedSession?.id ?? ""} />
              <input type="hidden" name="routine" value={dueRoutine ?? ""} />
              <input
                type="hidden"
                name="minutes"
                value={
                  plannedSession?.start && plannedSession.end
                    ? Math.round(
                        (plannedSession.end.getTime() - plannedSession.start.getTime()) /
                          60_000,
                      )
                    : ""
                }
              />
              <label className="k-stack g1 k-grow">
                <span className="k-help">Sposta l’allenamento alle</span>
                <input
                  className="k-text"
                  type="time"
                  name="at"
                  required
                  defaultValue={sessionAt === null ? "" : F.time(sessionAt)}
                />
              </label>
              <button type="submit" className="k-btn secondary">
                Sposta
              </button>
            </form>
          )}
          <div className="k-line wrap">
            {open >= today && (
              <a className="k-btn secondary" href={"/aggiungi?giorno=" + open}>
                + previsto
              </a>
            )}
            {open >= today && (
              <form action={copyYesterday.bind(null, open)}>
                <button type="submit" className="k-btn secondary">
                  Copia i pasti di ieri
                </button>
              </form>
            )}
            <a
              className="k-btn secondary"
              href={open === today ? "/oggi" : "/oggi/" + open}
            >
              Apri il giorno
            </a>
            {sheetPlan?.model && (
              <a
                className="k-btn secondary"
                href={"/piano/modello/" + sheetPlan.model.id}
              >
                Apri il modello
              </a>
            )}
          </div>
        </section>
      )}

      <section className="k-section g3" aria-label="Le regole">
        <h2>
          Le regole{" "}
          <a className="k-link" href="/piano/modelli">
            tutti i modelli ›
          </a>
        </h2>
        <Box
          density="row"
          rail={false}
          entry={{
            fam: "day",
            title: "Settimana tipo",
            value: F.plural(book.week.size, "giorno", "giorni"),
            meta: WEEKDAYS.map(
              ([d, l]) =>
                l +
                " " +
                (book.models.find((m) => m.id === book.week.get(d))?.name ?? "—"),
            ).join(" · "),
            href: "/piano/modelli",
            hrefLabel: "Apri la settimana tipo",
          }}
        />
        {cycles
          .filter((c) => c.active)
          .map((c) => (
            <Box
              key={c.id}
              density="row"
              rail={false}
              entry={{
                fam: "train",
                sub: "strength",
                title: "Ciclo " + c.name,
                value: F.plural(c.steps.length, "passo", "passi"),
                meta: c.steps.map(stepName).join(" · "),
                href: "/piano/ciclo/" + c.id,
                hrefLabel: "Apri il ciclo " + c.name,
              }}
            />
          ))}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="plan" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
