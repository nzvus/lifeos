/**
 * «Come valutiamo» (V-16, the board Scores): `/andamento/come-valutiamo`,
 * one E7 model at a time (`?modello=`): what it judges, the latest thing it
 * scored as a box and as the big skyline (each column a part, as wide as its
 * weight, as full as its score; the dashed line at 70), then each part with
 * its weight, the range it may move in and why it is there, and the
 * sources. The weights move within their ranges (`WeightsForm`), kept
 * dated in prefs (core/account/weights); every score reads them.
 * The subject is the last weigh-in, night or water of the week; a meal,
 * a session and the day open their score where they are (Oggi, the gym).
 */
import type { CSSProperties } from "react";
import { Box, F, NavBar, PageHeader, type BoxEntry } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { dayMinute, loadDays, type Day } from "@/core/day";
import { addDays, logicalDay } from "@/core/engines/time";
import { readGoals, readNumbers, readSpans, SLEEP_KINDS } from "@/core/goals";
import { readSettings } from "@/core/account/settings";
import {
  nightOf,
  sleepOfDay,
  sleepScore,
  waterOf,
  weighScore,
  type ScoreContext,
} from "@/features/day/score";
import { PLACES } from "@/features/places";
import { MODELS, modelPage } from "@/features/progress/models";
import { WeightsForm } from "@/features/progress/WeightsForm";
import { resetWeights, saveWeightsForm } from "./actions";

const SUBJECT_WHERE: Record<string, string> = {
  food: "Il voto di un pasto si apre toccando il pasto su Oggi.",
  session: "Il voto di una sessione si vede in palestra, mentre ti alleni.",
  day: "Il voto del giorno è nel riquadro del giorno su Oggi.",
};

export default async function ScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ modello?: string | string[] }>;
}) {
  const { modello } = await searchParams;
  const model = MODELS.find((m) => m.id === modello) ?? MODELS[0]!;
  const page = modelPage(model);
  // The person's weights for this model and version, when set (V-16).
  const set = (await ownerClock()).weights[model.id];
  const mine = set && set.version === model.version ? set : null;
  const subject = SUBJECT_WHERE[model.id] ? null : await latestSubject(model.id);
  const of = { fam: page.fam, ...(page.sub ? { sub: page.sub } : {}) };
  const score = subject?.score;
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Come valutiamo"
        context={page.name + " · dal " + F.date(page.since)}
        back={{ label: "Andamento", href: "/andamento" }}
        of={{ place: "andamento" }}
      />
      <section className="k-section g3" aria-label="Il modello">
        <nav className="k-line wrap g2" aria-label="Modelli di voto">
          {MODELS.map((m) => {
            const p = modelPage(m);
            return (
              <a
                key={m.id}
                className="k-chip"
                href={"/andamento/come-valutiamo?modello=" + m.id}
                aria-current={m.id === model.id ? "page" : undefined}
                style={
                  m.id === model.id
                    ? { background: "var(--ink)", color: "var(--sheet)" }
                    : undefined
                }
              >
                {p.name}
              </a>
            );
          })}
        </nav>
        <span className="k-body">{page.intro}</span>
        {subject ? (
          <>
            <Box rail={false} entry={subject} />
            {score && score.parts.length > 0 && (
              <div className={"fam-" + page.fam + (page.sub ? " sub-" + page.sub : "")}>
                <span className="k-sky big" aria-hidden="true">
                  {score.parts.map((q) => (
                    <span
                      key={q.name}
                      className="col"
                      style={
                        {
                          flexGrow: q.weight,
                          "--mix": Math.round(22 + q.score * 40) + "%",
                        } as CSSProperties
                      }
                    >
                      <span
                        className="fill"
                        style={{ height: Math.round(q.score * 100) + "%" }}
                      />
                      <span className="w">
                        {q.name + " " + Math.round(q.weight * 100) + " %"}
                      </span>
                    </span>
                  ))}
                  <span className="line" />
                </span>
              </div>
            )}
            <span className="k-meta">
              Lo stesso skyline dei riquadri, in grande: ogni colonna è un criterio, larga
              quanto il suo peso, piena quanto il suo voto. Il tratteggio è il 70: sopra,
              raggiunto.
            </span>
          </>
        ) : (
          <span className="k-meta">
            {SUBJECT_WHERE[model.id] ??
              "Niente da mostrare negli ultimi 7 giorni: il voto compare con la prossima voce."}
          </span>
        )}
      </section>
      <section className="k-section g3" aria-label="I criteri">
        <h2>I criteri e il loro peso</h2>
        <WeightsForm
          key={model.id + (mine?.since ?? "")}
          of={of}
          since={mine?.since ?? null}
          parts={page.parts.map((p) => ({
            key: p.key,
            name: p.name,
            why: p.why,
            min: p.min,
            max: p.max,
            def: p.weight,
            value: mine?.values[p.key] ?? p.weight,
            locked: p.locked,
            now:
              score?.parts.find(
                (q) => q.name.toLowerCase().split(" · ")[0] === p.name.toLowerCase(),
              )?.score ?? null,
          }))}
          save={saveWeightsForm.bind(null, model.id)}
          reset={resetWeights.bind(null, model.id)}
        />
      </section>
      <section className="k-section" aria-label="Le fonti">
        <h2>Le fonti</h2>
        <span className="k-body">{page.sources}</span>
      </section>
      <div className="k-nav k-stick">
        <NavBar active="progress" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}

/** The latest weigh-in, night or water of the last 7 days, scored as on Oggi. */
async function latestSubject(model: string): Promise<BoxEntry | null> {
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  const today = logicalDay(new Date(), known.clock);
  const from = addDays(today, -6);
  const [days, weighings, goals, nights, profile] = await Promise.all([
    loadDays(db, owner, from, today, known),
    model === "weighing"
      ? readNumbers(db, owner, "weigh_in", "weightKg", addDays(from, -27), today)
      : Promise.resolve([]),
    model === "weighing" ? readGoals(db, owner, today) : Promise.resolve([]),
    model === "sleep"
      ? readSpans(db, owner, SLEEP_KINDS, addDays(from, -8), addDays(today, 1))
      : Promise.resolve([]),
    readSettings(db, owner),
  ]);
  const series = weighings
    .map((w) => ({ day: w.day, kg: w.n }))
    .sort((a, b) => a.day.localeCompare(b.day));
  const goal = goals.find(
    (g) => g.source === "weight" && g.target === "reach" && g.value !== null,
  );
  const ctxOf = (d: string): ScoreContext => ({
    date: d,
    clock: known.clock,
    weighings: series.filter((w) => w.day <= d),
    weightGoal: goal ? { value: goal.value!, since: goal.since, by: goal.by } : null,
    nights,
    sex: profile.sex,
    now: d === today ? dayMinute(new Date(), today, known.clock) : null,
    weights: known.weights,
  });
  const items = (d: Day) => [...d.timed, ...d.untimed];
  const when = (d: Day) =>
    d.day === today ? "oggi" : d.day === addDays(today, -1) ? "ieri" : F.day(d.day);
  for (const d of [...days].reverse()) {
    if (model === "weighing") {
      const w = items(d).find(
        (i) => i.kind.key === "weigh_in" && i.status === "done" && i.values["weightKg"],
      );
      const s = w && weighScore(w, items(d), ctxOf(d.day));
      if (w && s)
        return {
          fam: "body",
          sub: "weight",
          title: "La pesata di " + when(d),
          value: F.num(Number(w.values["weightKg"]), "kg"),
          score: s,
        };
    } else if (model === "sleep") {
      const n = nightOf(items(d), ctxOf(d.day));
      const s = n && sleepScore(n, items(d), ctxOf(d.day));
      if (n && s)
        return {
          fam: "sleep",
          sub: "wake",
          title: "La notte di " + when(d),
          value: F.hm(sleepOfDay(items(d), ctxOf(d.day)).totalMin),
          score: s,
        };
    } else if (model === "water") {
      if (!items(d).some((i) => i.kind.key === "water" && i.status === "done")) continue;
      const box = waterOf(items(d), ctxOf(d.day)).box;
      if (box.score) return { ...box, title: "L’acqua di " + when(d) };
    }
  }
  return null;
}
