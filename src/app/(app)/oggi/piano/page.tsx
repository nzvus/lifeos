/**
 * Oggi · Piano (flows.md §1, V-08; PAT-03, MOD-32, PL-40; change 2026-11-07-piano): the week
 * holding `?settimana=` (today's when missing), one row per day (features/plan/week-rows): its
 * ciclo step, what was done or is planned, its kcal. The day in `?giorno=` (today in this week,
 * else none) opens below: each ciclo's step chosen by hand or a rest, «Salta», the voci planned
 * and what the blocchi still plan (`../plan-rows`), «+ previsto». Then his blocchi and cicli
 * (the kit `Elenco`, PL-70). Day models and the week type are gone.
 */
import { Box, DateNav, Elenco, F, PageHeader, weekOf, AreaTabs } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDays, readRangeTargets } from "@/core/day";
import { ensureWeekTargets } from "@/core/energy";
import {
  listBlocks,
  planTag,
  planWords,
  readCycleBook,
  readDayPlans,
} from "@/core/plans";
import { logicalDay } from "@/core/engines/time";
import { present } from "@/features/day/present";
import { withCompounds } from "@/features/day/compounds";
import { foodIds } from "@/features/day/nutrients";
import { dayRow } from "@/features/plan/week-rows";
import { planSections } from "@/features/plan/plan-sections";
import { readFoodEstimates } from "@/core/food/catalog";
import { tabHrefs } from "@/features/places";
import { plan } from "@/i18n/plan";
import { skipStep } from "../[[...day]]/plan-actions";
import { planRows } from "../plan-rows";
import { copyYesterday, moveTraining, overrideStep } from "../../piano/actions";

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
  const [days, plans, blocks, { cycles }] = await Promise.all([
    loadDays(db, owner, week[0]!, week[6]!, known),
    readDayPlans(db, owner, week[0]!, week[6]!, today),
    listBlocks(db, owner, false),
    readCycleBook(db, owner),
    // A week begun: its automatic targets, made when missing.
    week[0]! <= today ? ensureWeekTargets(db, owner, week[0]!, known.clock) : null,
  ]);
  // A coffee or creatine planned is drawn as on Oggi («Caffè ≈ 100 mg»), not as grams.
  const [compounds, targets] = await Promise.all([
    readFoodEstimates(db, owner, days.flatMap(foodIds)),
    // Each day's kcal from the week and the food goals (PL-61).
    readRangeTargets(db, owner, week[0]!, week[6]!),
  ]);
  const ctx = { compounds, doses: [], bed: null, creatine: null };
  // The header names the open day's cycles (the week's first day when none is open).
  const headPlan = plans.get(open ?? week[0]!);
  const sheet = open ? days.find((d) => d.day === open) : undefined;
  const sheetPlan = open ? plans.get(open) : undefined;
  const items = sheet ? [...sheet.timed, ...sheet.untimed] : [];
  const fromPlan =
    open && open >= today
      ? await planRows(db, owner, {
          day: open,
          clock: known.clock,
          voci: items,
          cycles: sheetPlan?.cycles ?? [],
          nowMinute: null,
        })
      : [];
  const stepName = (s: (typeof cycles)[number]["steps"][number]) =>
    s.label || s.items.map((i) => i.name).join(" + ") || "Riposo";
  // «Sposta l'allenamento»: the day's planned session, else the Piano's training row.
  const plannedSession = items.find(
    (i) => i.kind.key === "session" && i.status === "planned",
  );
  const ghostSession = fromPlan.find((m) => m.fam === "train");
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
        title="Oggi"
        context={[
          F.week(week[0]!),
          ...(headPlan?.cycles ?? []).map((c) => "ciclo " + c.cycle),
        ]
          .filter(Boolean)
          .join(" · ")}
        action={{ label: plan.elenco.addBlock, href: "/oggi/blocco/nuovo" }}
        of={{ place: "oggi" }}
      />
      <AreaTabs tab="piano" hrefs={tabHrefs("oggi")} />
      <section className="k-block g3">
        <DateNav
          mode="week"
          day={open ?? week[0]!}
          today={today}
          hrefBase="/oggi/piano?giorno="
          weekBase="/oggi/piano?settimana="
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
            Cambia solo questo giorno: i blocchi e il ciclo restano come sono.
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
          {fromPlan.map((m) => (
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
          </div>
        </section>
      )}

      <section className="k-section g3" aria-label={plan.elenco.blocks}>
        <Elenco
          archived={false}
          filterHref={{
            active: "/oggi/piano",
            archived: "/oggi/elenco?archiviati=1#blocchi",
          }}
          sections={planSections({ blocks, cycles, archived: false, area: null })}
        />
      </section>
    </main>
  );
}
