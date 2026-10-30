/**
 * Visual study, round 2 of «la settimana» (ledger UI-76, dossiers/visual.md
 * §3.4): v2's strip as it is today (away from today, with ‹ › and «Oggi»),
 * then the proposal (`DayHead`): no arrows or button in the line, levels like
 * the weather, the 24-hour rhythm as the third level, on the developer's real
 * week (the one of 29 Oct). Local study only.
 */
import { DateNav, F, MET } from "@lifeos/kit";
import { DayHead } from "./dayhead";
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

/** The proposal's styles (study only; a server constant, never from the client module). */
export const DAYHEAD_CSS = `
.st-dh .top{justify-content:flex-start;gap:8px}
.st-dh .ttl{flex:0 1 auto;justify-content:flex-start}
.st-dh .back{margin-left:auto;font-family:var(--font-display);font-size:var(--fs-b2);font-weight:600;color:var(--herb);text-decoration:none;min-height:var(--touch);display:inline-flex;align-items:center;padding:0 4px}
.st-dh .lv{margin-left:auto;min-width:var(--touch);min-height:var(--touch);border:0;background:transparent;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.st-dh .back+.lv{margin-left:0}
.st-dh .k-week{touch-action:pan-y;user-select:none}
.st-dh .k-week a.today:not([aria-current]){box-shadow:inset 0 0 0 1.5px var(--hairline)}
.st-rh{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;position:relative;height:96px;margin-top:2px}
.st-rh .day{position:relative;height:100%;border-radius:var(--r-control);background:color-mix(in srgb,var(--ink) 4%,transparent);overflow:hidden}
:is(.st-rh,.st-col) .gd{position:absolute;left:0;right:0;border-top:1px dashed color-mix(in srgb,var(--ink) 12%,transparent)}
.st-rh .gl{position:absolute;right:100%;margin-right:2px;font-size:9px;line-height:1;color:var(--muted);transform:translateY(-50%)}
:is(.st-rh,.st-col) .sl{position:absolute;left:25%;width:50%;border-radius:2px;background:color-mix(in srgb,var(--moment-dinner) 50%,transparent)}
:is(.st-rh,.st-col) .tr{position:absolute;left:18%;width:64%;border-radius:2px;background:var(--muscle-legs)}
:is(.st-rh,.st-col) .ml{position:absolute;left:calc(50% - 3.5px);width:7px;height:7px;border-radius:50%;margin-top:-3.5px;box-shadow:0 0 0 1.5px var(--paper)}
:is(.st-rh,.st-col) .nw{position:absolute;left:-2px;right:-2px;border-top:1.5px solid var(--tomato)}
.st-dh .k-week a{position:relative}
.st-col{position:relative;display:block;width:74%;height:96px;margin-top:6px;border-radius:4px;background:color-mix(in srgb,var(--ink) 6%,transparent);overflow:hidden}
.st-dh .k-week a[aria-current] .st-col{background:var(--paper)}
.k-wbars.st-bg{position:absolute;left:16%;right:16%;top:22px;bottom:4px;height:auto;margin:0;gap:3px;opacity:.28;z-index:0}
.k-wbars.st-bg>i{width:4px}
.v-b .k-week a>:not(.st-bg){position:relative;z-index:1}
.st-key{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:var(--muted)}
.st-key i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:-1px}
`;

const MONDAY = "2026-10-26";
const LAST = "2026-10-29";

type Known = Awaited<ReturnType<typeof readClock>>;
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
  const trained = facts.filter((f) => f.train === "done").length;
  const shortNights = facts.filter((f) => f.sleepH > 0 && f.sleepH < 7).length;
  const foodOk = facts.filter((f) => f.food !== null && f.food * 100 >= MET).length;
  const rhythm = Object.fromEntries(
    all.map((f) => [f.day, { bands: f.bands, meals: f.meals, sessions: f.sessions }]),
  );
  return (
    <main className="k-page">
      <style>{DAYHEAD_CSS}</style>
      <section className="k-section g2" aria-label="Com’è oggi">
        <h2>La settimana, secondo giro — la tua settimana del 29 ottobre</h2>
        <p className="k-help">
          Hai scritto: «com’è attualmente in v2 è il migliore, al di là delle frecce di
          navigazione che rompono tutto (…«vai a oggi»…)» e che il ritmo (1) è il più
          bello ma non così grosso in Oggi. Prima com’è oggi, lontano da oggi:
        </p>
        <DateNav
          day="2026-10-27"
          today={LAST}
          hrefBase="/studio/settimana?"
          scores={scores}
          bars={bars}
        />
      </section>
      <section className="k-section g2" aria-label="A · la colonna">
        <h2>A · Ogni giorno una colonna — terzo giro</h2>
        <p className="k-help">
          Hai scritto «ancora non mi convincono del tutto». Qui ogni giorno è un oggetto
          solo: il numero, le barre e, al terzo livello, la stessa casella che scende
          nelle sue 24 ore (sonno, pasti col colore del momento, allenamento, la riga
          rossa è adesso). Niente frecce né pulsanti: si scorre col dito, il titolo apre
          il mese, «↩ oggi» solo quando sei altrove, i puntini sono i livelli.
        </p>
        <DayHead
          day="2026-10-27"
          today={LAST}
          hrefBase="/studio/settimana?"
          bars={bars}
          rhythm={rhythm}
          nowMinute={13 * 60 + 10}
          levelKey="studio.settimana.a"
          fallback={2}
          variant="a"
        />
      </section>
      <section className="k-section g2" aria-label="B · le barre nello sfondo">
        <h2>B · Le barre nello sfondo</h2>
        <p className="k-help">
          La tua idea del 25 ottobre: le barre sottili e trasparenti nello sfondo di ogni
          quadratino, dietro al numero; la striscia diventa più bassa. Al terzo livello le
          24 ore sotto, come nel secondo giro.
        </p>
        <DayHead
          day={LAST}
          today={LAST}
          hrefBase="/studio/settimana?"
          bars={bars}
          rhythm={rhythm}
          nowMinute={13 * 60 + 10}
          levelKey="studio.settimana.b"
          variant="b"
        />
        <DayHead
          day="2026-10-27"
          today={LAST}
          hrefBase="/studio/settimana?"
          bars={bars}
          rhythm={rhythm}
          nowMinute={13 * 60 + 10}
          levelKey="studio.settimana.c"
          fallback={2}
          variant="b"
        />
        <p className="k-body">
          {F.plural(trained, "allenamento fatto", "allenamenti fatti")} ·{" "}
          {F.plural(foodOk, "giorno", "giorni")} col cibo nella fascia ·{" "}
          {F.plural(shortNights, "notte", "notti")} sotto le 7 ore
        </p>
      </section>
    </main>
  );
}
