/**
 * Visual study, choice «la settimana» (dossiers/visual.md §3.1, ledger UI-74):
 * the week strip as v2 draws it today, beside three rethought ways, on the
 * developer's real week (the one of 29 Oct). Local study only.
 *   1 · the rhythm: each day as its 24 hours — sleep, meals by role, training — so
 *       times and regularity show (data collected and never drawn, visual.md §0c)
 *   2 · three states: each day's food, training and sleep as judged, no quantities
 *   3 · the sentence: the strip keeps the day's score only; the week in words below
 */
import type { CSSProperties } from "react";
import { DateNav, F, MET, PART } from "@lifeos/kit";
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import {
  dayMinute,
  loadDays,
  readClock,
  readDayTargets,
  readMicroTargets,
  type Day,
  type DayItem,
} from "@/core/day";
import { readFoodEstimates } from "@/core/food/catalog";
import { readSpans, SLEEP_KINDS } from "@/core/goals";
import { readDayPlans } from "@/core/plans";
import { readSettings } from "@/core/account/settings";
import { addDays, type IsoDate } from "@/core/engines/time";
import { presentWeek, weekBars, weekScores } from "@/features/day/day-score";
import { foodIds } from "@/features/day/nutrients";
import { nightOf, sleepOfDay, sleepScore, type ScoreContext } from "@/features/day/score";

const MONDAY = "2026-10-26";
const LAST = "2026-10-29";
const H = 200;

type Known = Awaited<ReturnType<typeof readClock>>;
type Level = "met" | "part" | "no" | "none";
const HEAT: Record<Level, string> = {
  met: "var(--heat-good)",
  part: "var(--heat-fair)",
  no: "var(--heat-bad)",
  none: "var(--hairline)",
};
const level = (v: number | null): Level =>
  v === null ? "none" : v >= MET ? "met" : v >= PART ? "part" : "no";
const ROLE: Record<string, string> = {
  breakfast: "var(--moment-breakfast)",
  lunch: "var(--moment-lunch)",
  dinner: "var(--moment-dinner)",
  snack: "var(--moment-snack)",
};

export async function WeekStudio({
  db,
  owner,
  known,
}: {
  db: Db;
  owner: Owner;
  known: Known;
}) {
  const week = Array.from({ length: 7 }, (_, i) => addDays(MONDAY, i));
  const [days, micros, plans, nights, profile] = await Promise.all([
    loadDays(db, owner, MONDAY, LAST, known),
    readMicroTargets(db, owner, LAST),
    readDayPlans(db, owner, week[0]!, week[6]!, LAST),
    readSpans(db, owner, SLEEP_KINDS, addDays(MONDAY, -8), addDays(LAST, 1)),
    readSettings(db, owner),
  ]);
  const targets = new Map(
    await Promise.all(
      days.map(async (d) => {
        const m = plans.get(d.day)?.model;
        return [
          d.day,
          await readDayTargets(
            db,
            owner,
            d.day,
            m ? { name: m.name, targets: m.targets } : null,
          ),
        ] as const;
      }),
    ),
  );
  const estimates = await readFoodEstimates(db, owner, days.flatMap(foodIds));
  const present = presentWeek({ days, targets, estimates, micros, weighings: [] });
  const ctxOf = (date: IsoDate): ScoreContext => ({
    date,
    clock: known.clock,
    weighings: null,
    weightGoal: null,
    nights,
    sex: profile.sex,
    now: null,
    weights: known.weights,
  });
  const input = {
    days,
    present,
    ctx: ctxOf(LAST),
    today: LAST,
    nowMinute: null,
    weighings: [],
  };
  const scores = weekScores(input);
  const bars = weekBars(input);
  const items = (d: Day) => [...d.timed, ...d.untimed];
  const facts = days.map((d) => {
    const c = ctxOf(d.day);
    const its = items(d);
    const sd = sleepOfDay(its, c);
    const n = nightOf(its, c);
    const sleep = n ? (sleepScore(n, its, c)?.value ?? null) : null;
    const done = (i: DayItem) => i.status === "done";
    const min = (at: Date) =>
      Math.max(0, Math.min(1440, dayMinute(at, d.day, known.clock)));
    return {
      day: d.day,
      sleepH: sd.totalMin / 60,
      sleep,
      food: bars[d.day]?.food ?? null,
      train: bars[d.day]?.train ?? null,
      // this day's sleep, and the evening part of the night that ends the next morning
      bands: [
        sd.night,
        ...sd.naps,
        // the next night comes from the context's sleep pieces (ctx.nights), not from a day's entries
        sleepOfDay([], ctxOf(addDays(d.day, 1))).night,
      ]
        .flatMap((p) => (p ? [{ from: min(p.bed), to: min(p.wake) }] : []))
        .filter((b) => b.to > b.from),
      meals: its
        .filter((i) => i.kind.key === "meal" && done(i) && i.minute !== null)
        .map((i) => ({
          at: i.minute!,
          c: ROLE[String(i.values["role"] ?? "")] ?? "var(--kcal)",
        })),
      sessions: its
        .filter((i) => i.kind.key === "session" && done(i) && i.start && i.end)
        .map((i) => ({ from: min(i.start!), to: min(i.end!) })),
    };
  });
  // The days after the last one stay as empty columns, as on the strip.
  const empty = week
    .filter((d) => !facts.some((f) => f.day === d))
    .map((day) => ({
      day,
      sleepH: 0,
      sleep: null,
      food: null,
      train: null,
      bands: [],
      meals: [],
      sessions: [],
    }));
  const all = [...facts, ...empty];
  const pct = (m: number) => ((m / 1440) * H).toFixed(1) + "px";
  const trained = facts.filter((f) => f.train === "done").length;
  const shortNights = facts.filter((f) => f.sleepH > 0 && f.sleepH < 7).length;
  const foodOk = facts.filter((f) => f.food !== null && f.food * 100 >= MET).length;
  return (
    <main className="k-page">
      <section className="k-section g2" aria-label="Com’è oggi">
        <h2>Scelta · la settimana — la tua settimana del 29 ottobre</h2>
        <p className="k-help">
          Com’è oggi in v2: la striscia con le barre sottili per giorno (cibo, limiti,
          allenamento, abitudini) e il voto. Sotto, tre modi nuovi.
        </p>
        <DateNav
          day={LAST}
          today={LAST}
          hrefBase="/studio/settimana?"
          scores={scores}
          bars={bars}
        />
      </section>

      <section className="k-section g2" aria-label="1 · Il ritmo">
        <h2>1 · Il ritmo</h2>
        <p className="k-help">
          Ogni giorno come le sue 24 ore, dall’alto (mezzanotte) al basso: il sonno, i
          pasti col colore del momento, l’allenamento. Si vedono gli orari e quanto sono
          regolari: dati che raccogli e che oggi l’app non disegna.
        </p>
        <div className="k-week">
          {all.map((f) => (
            <span key={f.day} className="k-stack g1" aria-label={F.Day(f.day)}>
              <span className="k-help">{F.letter(f.day)}</span>
              <span className="k-num b2">{Number(f.day.slice(8))}</span>
              <span className="k-rel" style={{ height: H + "px", width: "100%" }}>
                {f.bands.map((b, i) => (
                  <span
                    key={"s" + i}
                    style={
                      {
                        position: "absolute",
                        left: "30%",
                        width: "40%",
                        top: pct(b.from),
                        height: pct(b.to - b.from),
                        background:
                          "color-mix(in srgb, var(--moment-dinner) 45%, transparent)",
                        borderRadius: "3px",
                      } as CSSProperties
                    }
                  />
                ))}
                {f.sessions.map((b, i) => (
                  <span
                    key={"t" + i}
                    style={{
                      position: "absolute",
                      left: "20%",
                      width: "60%",
                      top: pct(b.from),
                      height: pct(Math.max(b.to - b.from, 12)),
                      background: "var(--muscle-legs)",
                      borderRadius: "3px",
                    }}
                  />
                ))}
                {f.meals.map((m, i) => (
                  <span
                    key={"m" + i}
                    style={{
                      position: "absolute",
                      left: "calc(50% - 4px)",
                      width: "8px",
                      height: "8px",
                      top: pct(m.at),
                      background: m.c,
                      borderRadius: "50%",
                    }}
                  />
                ))}
              </span>
            </span>
          ))}
        </div>
        <p className="k-help">
          viola: il sonno · pallini: i pasti (colazione, pranzo, cena, spuntino) · verde:
          l’allenamento
        </p>
      </section>

      <section className="k-section g2" aria-label="2 · Tre stati">
        <h2>2 · Tre stati</h2>
        <p className="k-help">
          Per ogni giorno tre quadratini: cibo, allenamento, sonno, colorati dal giudizio
          (bene, così così, male, niente). Nessuna quantità: uno stato da controllare.
        </p>
        <div className="k-week">
          {all.map((f) => {
            const t: Level =
              f.train === "done" ? "met" : f.train === "planned" ? "no" : "none";
            const cells: [string, Level][] = [
              ["cibo", level(f.food === null ? null : f.food * 100)],
              ["allenamento", t],
              ["sonno", level(f.sleep)],
            ];
            return (
              <span
                key={f.day}
                className="k-stack g1"
                aria-label={
                  F.Day(f.day) + ": " + cells.map((c) => c[0] + " " + c[1]).join(", ")
                }
              >
                <span className="k-help">{F.letter(f.day)}</span>
                <span className="k-num b2">{Number(f.day.slice(8))}</span>
                {cells.map(([k, l]) => (
                  <span
                    key={k}
                    style={{
                      height: "10px",
                      width: "70%",
                      background: HEAT[l],
                      borderRadius: "3px",
                    }}
                  />
                ))}
              </span>
            );
          })}
        </div>
        <p className="k-help">
          dall’alto: cibo · allenamento · sonno — verde bene, giallo così così, rosso
          male, grigio niente
        </p>
      </section>

      <section className="k-section g2" aria-label="3 · La frase">
        <h2>3 · La frase</h2>
        <p className="k-help">
          La striscia tiene solo i giorni e il loro voto; la settimana si dice in parole,
          sotto.
        </p>
        <div className="k-week">
          {week
            .map((day) => ({ day }))
            .map((d) => (
              <span key={d.day} className="k-stack g1">
                <span className="k-help">{F.letter(d.day)}</span>
                <span
                  className="k-num b2"
                  style={
                    scores[d.day] !== undefined
                      ? { color: HEAT[level(scores[d.day]!)] }
                      : {}
                  }
                >
                  {Number(d.day.slice(8))}
                </span>
              </span>
            ))}
        </div>
        <p className="k-body">
          {F.plural(trained, "allenamento fatto", "allenamenti fatti")} ·{" "}
          {F.plural(foodOk, "giorno", "giorni")} col cibo nella fascia ·{" "}
          {F.plural(shortNights, "notte", "notti")} sotto le 7 ore
        </p>
      </section>
    </main>
  );
}
