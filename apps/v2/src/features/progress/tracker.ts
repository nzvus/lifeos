/**
 * features/progress/tracker.ts — a tracker page (V-06, the board Tracker):
 * one kind over the period, as the page draws it — the period's box with
 * its score, three stats, the chart, each entry a row with its own score.
 * Weight (trend chart: the scale's points, the trend that trusts fasted
 * weighings more — the board's smoothing — and the goal line), sleep (bars
 * against 7–9 h), water (bars against the day's need), steps (bars against
 * the goal; no score: the movement dossier has not decided one). Pure: the
 * page brings the days already loaded (core/day) and the scores' context.
 */
import { F, type BoxEntry, type ChartData, type GlyphOf } from "@lifeos/kit";
import type { Day, DayItem } from "@/core/day";
import type { Kind } from "@/core/kinds";
import { present } from "@/features/day/present";
import type { WeightProgress } from "@/core/goals";
import { isoWeekday, localParts } from "@/core/engines/time";
import {
  nightOf,
  sleepScore,
  waterOf,
  weighScore,
  type ScoreContext,
} from "@/features/day/score";
import { averageScore } from "./average";

export const TRACKERS = ["peso", "sonno", "acqua", "passi"] as const;
export type Tracker = (typeof TRACKERS)[number];

export type TrackerView = {
  title: string;
  of: GlyphOf;
  context: string;
  head: BoxEntry;
  stats: { l: string; v: string; u: string }[];
  chart: { type: "trend" | "bars"; data: ChartData; caption: string } | null;
  rowsTitle: string;
  rowsNote: string;
  rows: BoxEntry[];
  about: string;
};

const items = (d: Day) => [...d.timed, ...d.untimed];
const done = (i: DayItem) => i.status === "done";
const num = (v: unknown) => (typeof v === "string" && v !== "" ? Number(v) : null);
/** Day numbers under the chart, thinned to about eight. */
const labels = (days: readonly string[]) => {
  const k = Math.ceil(days.length / 8);
  return days.map((d, i) =>
    (days.length - 1 - i) % k === 0 ? String(Number(d.slice(8))) : "",
  );
};
const roundDown = (v: number, step: number) => Math.floor(v / step) * step;
const roundUp = (v: number, step: number) => Math.ceil(v / step) * step;

/** The board's trend: each weighing moves it by 35 % when fasted, 15 % otherwise. */
export function smoothWeight(ws: readonly { kg: number; fasted: boolean }[]): number[] {
  let t = ws[0]?.kg ?? 0;
  return ws.map((w, i) => {
    if (i) t = t + (w.fasted ? 0.35 : 0.15) * (w.kg - t);
    return Math.round(t * 100) / 100;
  });
}

export function weightTracker(p: {
  days: readonly Day[];
  ctxOf: (day: string) => ScoreContext;
  progress: WeightProgress | null;
  goal: { value: number; by: string | null } | null;
  /** What E4 learnt the person spends (the last week's decision). */
  energy: { kcal: number; sigma: number; loggedDays: number } | null;
}): TrackerView {
  const ws = p.days.flatMap((d) =>
    items(d)
      .filter((i) => i.kind.key === "weigh_in" && done(i) && num(i.values["weightKg"]))
      .map((i) => ({
        day: d.day,
        item: i,
        kg: num(i.values["weightKg"])!,
        fasted: i.values["fasted"] === true || i.values["fasted"] === "true",
        score: weighScore(i, items(d), p.ctxOf(d.day)),
      })),
  );
  const trend = smoothWeight(ws);
  const last = trend.at(-1);
  const fasted = ws.filter((w) => w.fasted).length;
  const all = [...ws.map((w) => w.kg), ...trend];
  const lo = all.length ? roundDown(Math.min(...all) - 0.3, 0.5) : 0;
  const hi = all.length ? roundUp(Math.max(...all) + 0.3, 0.5) : 1;
  const g = p.goal;
  const out = g
    ? g.value < lo
      ? " ↓ fuori scala"
      : g.value > hi
        ? " ↑ fuori scala"
        : ""
    : "";
  const score = averageScore(ws.map((w) => w.score));
  const pr = p.progress;
  return {
    title: "Peso",
    of: { fam: "body", kind: "weight" },
    context:
      ws.length === 0
        ? "nessuna pesata nel periodo"
        : F.plural(ws.length, "pesata", "pesate") + " dal " + F.date(ws[0]!.day),
    head: {
      fam: "body",
      sub: "weight",
      title: "Il periodo",
      ...(last !== undefined ? { value: F.num(last, "kg") } : {}),
      ...(score ? { score } : {}),
      pills: ws.length
        ? [
            { t: fasted + " su " + ws.length + " a digiuno", state: "good" as const },
            { t: "trend " + F.signed(last! - trend[0]!, "kg") },
          ]
        : [],
    },
    stats:
      last === undefined
        ? []
        : [
            { l: "Trend", v: F.n(last, 1), u: "± 0,3 kg" },
            ...(pr?.pace != null
              ? [{ l: "Ritmo", v: F.n(pr.pace, 2), u: "kg a settimana" }]
              : [{ l: "Pesate", v: String(ws.length), u: "nel periodo" }]),
            ...(pr?.needed != null && g?.by
              ? [{ l: "Ne servono", v: F.n(pr.needed, 2), u: "per il " + F.date(g.by) }]
              : [{ l: "Variazione", v: F.n(last - trend[0]!, 1), u: "kg nel periodo" }]),
          ],
    chart:
      ws.length === 0
        ? null
        : {
            type: "trend",
            data: {
              x: labels(ws.map((w) => w.day)),
              y: ws.map((w) => w.kg),
              trend,
              sd: 0.3,
              unit: "kg",
              lo,
              hi,
              ticks: [
                ...new Set([
                  roundDown(hi - (hi - lo) / 4, 0.5),
                  roundUp(lo + (hi - lo) / 4, 0.5),
                ]),
              ],
              ...(g
                ? {
                    goal: g.value,
                    goalText:
                      "obiettivo " +
                      F.n(g.value, 1) +
                      (g.by ? " · " + F.date(g.by) : "") +
                      out,
                  }
                : {}),
            },
            caption:
              "Punti: la bilancia. Linea: il peso senza l’acqua, con la sua incertezza; una pesata a digiuno la sposta di più.",
          },
    rowsTitle: "Pesate",
    rowsNote:
      "Il voto non giudica il numero: misura quanto la pesata è affidabile. Il contesto (cibo prima, allenamento, notte corta) la fa contare meno.",
    rows: [...ws].reverse().map((w) => ({
      fam: "body",
      sub: "weight",
      title: F.Day(w.day),
      value: F.num(w.kg, "kg"),
      meta: w.fasted ? "a digiuno" : "non a digiuno",
      href: "/voce/" + w.item.id,
      hrefLabel: "La pesata di " + F.day(w.day),
      ...(w.score ? { score: w.score } : {}),
    })),
    about: p.energy
      ? "Consumi ≈ " +
        F.n(p.energy.kcal, 0) +
        " ± " +
        F.num(p.energy.sigma, "kcal") +
        " al giorno, imparato dalle pesate e da " +
        F.plural(p.energy.loggedDays, "giorno registrato", "giorni registrati") +
        ". L’incertezza scende con ogni pesata."
      : "Con qualche pesata e i pasti registrati, lifeos impara quanto consumi.",
  };
}

export function sleepTracker(p: {
  days: readonly Day[];
  period: readonly string[];
  ctxOf: (day: string) => ScoreContext;
  timeZone: string;
}): TrackerView {
  const nights = p.days.flatMap((d) => {
    const n = nightOf(items(d));
    if (!n) return [];
    const minutes = (n.end!.getTime() - n.start!.getTime()) / 60_000;
    return [
      { day: d.day, item: n, minutes, score: sleepScore(n, items(d), p.ctxOf(d.day)) },
    ];
  });
  const by = new Map(nights.map((n) => [n.day, n]));
  const hours = p.period.map((d) => (by.get(d)?.minutes ?? 0) / 60);
  const mean = nights.length
    ? nights.reduce((a, n) => a + n.minutes, 0) / nights.length
    : null;
  const short = nights.filter((n) => n.minutes < 7 * 60).length;
  const at = (d: Date) => F.time(localParts(d, p.timeZone).minute);
  const score = averageScore(nights.map((n) => n.score));
  return {
    title: "Sonno",
    of: { fam: "sleep", kind: "sleep" },
    context:
      nights.length === 0
        ? "nessuna notte nel periodo"
        : F.plural(nights.length, "notte", "notti") + " di " + p.period.length,
    head: {
      fam: "sleep",
      sub: "wake",
      title: "Il periodo",
      ...(mean !== null ? { value: F.hm(mean) } : {}),
      ...(score ? { score } : {}),
      ...(nights.length
        ? {
            pills: [
              {
                t: short + " sotto le 7 h",
                state: short === 0 ? ("good" as const) : ("warn" as const),
              },
            ],
          }
        : {}),
    },
    stats:
      mean === null
        ? []
        : [
            { l: "Media", v: F.n(mean / 60, 1), u: "ore a notte" },
            { l: "Sotto 7 h", v: String(short), u: "notti" },
            {
              l: "La più lunga",
              v: F.n(Math.max(...nights.map((n) => n.minutes)) / 60, 1),
              u: "ore",
            },
          ],
    chart:
      nights.length === 0
        ? null
        : {
            type: "bars",
            data: {
              x: labels(p.period),
              y: hours,
              unit: "h",
              lo: 0,
              hi: Math.max(10, roundUp(Math.max(...hours), 1)),
              bandLo: 7,
              bandHi: 9,
              ticks: [7, 9],
              decimals: 0,
            },
            caption: "Ogni barra una notte; la fascia: 7–9 ore. Sotto, in giallo.",
          },
    rowsTitle: "Notti",
    rowsNote:
      "Il voto: la durata contro il tuo bisogno, la regolarità degli orari, come dici di sentirti.",
    rows: [...nights].reverse().map((n) => ({
      fam: "sleep",
      sub: "wake",
      title: F.Day(n.day),
      value: F.hm(n.minutes),
      meta: "a letto " + at(n.item.start!) + " · sveglia " + at(n.item.end!),
      href: "/voce/" + n.item.id,
      hrefLabel: "La notte di " + F.day(n.day),
      ...(n.score ? { score: n.score } : {}),
    })),
    about:
      "La notte conta per il giorno in cui ti svegli. Il bisogno di sonno di un adulto è 7–9 ore.",
  };
}

export function waterTracker(p: {
  days: readonly Day[];
  period: readonly string[];
  ctxOf: (day: string) => ScoreContext;
}): TrackerView {
  const logged = p.days.flatMap((d) =>
    items(d).some((i) => i.kind.key === "water" && done(i))
      ? [{ day: d.day, ...waterOf(items(d), p.ctxOf(d.day)) }]
      : [],
  );
  const by = new Map(logged.map((w) => [w.day, w]));
  const needs = logged.flatMap((w) => (w.need === null ? [] : [w.need]));
  const meanNeed = needs.length ? needs.reduce((a, b) => a + b, 0) / needs.length : null;
  const mean = logged.length
    ? logged.reduce((a, w) => a + w.drunk, 0) / logged.length
    : null;
  const enough = logged.filter((w) => w.need !== null && w.drunk >= w.need).length;
  const y = p.period.map((d) => by.get(d)?.drunk ?? 0);
  const score = averageScore(logged.map((w) => w.box.score));
  return {
    title: "Acqua",
    of: { fam: "drink", kind: "water" },
    context:
      logged.length === 0
        ? "nessun giorno con l’acqua segnata"
        : F.plural(logged.length, "giorno", "giorni") + " segnati di " + p.period.length,
    head: {
      fam: "drink",
      sub: "water",
      title: "Il periodo",
      ...(mean !== null ? { value: F.num(mean, "l") } : {}),
      ...(score ? { score } : {}),
    },
    stats:
      mean === null
        ? []
        : [
            { l: "Media", v: F.n(mean, 1), u: "litri al giorno" },
            ...(meanNeed !== null
              ? [
                  { l: "Bisogno", v: F.n(meanNeed, 1), u: "litri, in media" },
                  { l: "Al bisogno", v: enough + " su " + logged.length, u: "giorni" },
                ]
              : []),
          ],
    chart:
      logged.length === 0
        ? null
        : {
            type: "bars",
            data: {
              x: labels(p.period),
              y,
              unit: "l",
              lo: 0,
              hi: roundUp(Math.max(...y, meanNeed ?? 0) + 0.5, 1),
              ...(meanNeed !== null
                ? { bandLo: meanNeed, bandHi: meanNeed + 0.5, ticks: [meanNeed] }
                : {}),
            },
            caption:
              "Ogni barra un giorno; la fascia parte dal bisogno medio (più nei giorni di allenamento).",
          },
    rowsTitle: "I giorni",
    rowsNote:
      "Il voto: bevuta contro quella attesa a quell’ora, dopo l’allenamento, distribuita nel giorno.",
    rows: [...logged].reverse().map((w) => ({
      ...w.box,
      title: F.Day(w.day),
      href: "/oggi/" + w.day,
      hrefLabel: "Il giorno " + F.day(w.day),
    })),
    about:
      "Il bisogno viene dal sesso e dagli allenamenti del giorno (il sudore); il cibo ne dà già una parte.",
  };
}

export function stepsTracker(p: {
  days: readonly Day[];
  period: readonly string[];
  goal: { value: number; weekdaysOnly: boolean } | null;
}): TrackerView {
  const entries = p.days.flatMap((d) =>
    items(d)
      .filter((i) => i.kind.key === "steps" && done(i))
      .map((i) => ({ day: d.day, item: i, n: num(i.values["steps"]) ?? 0 })),
  );
  const by = new Map<string, number>();
  for (const e of entries) by.set(e.day, (by.get(e.day) ?? 0) + e.n);
  const logged = p.period.filter((d) => by.has(d));
  const mean = logged.length
    ? logged.reduce((a, d) => a + by.get(d)!, 0) / logged.length
    : null;
  const counts = (d: string) => !p.goal?.weekdaysOnly || isoWeekday(d) <= 5;
  const goalDays = p.goal ? p.period.filter(counts) : [];
  const hit = p.goal
    ? goalDays.filter((d) => (by.get(d) ?? 0) >= p.goal!.value).length
    : 0;
  const y = p.period.map((d) => by.get(d) ?? 0);
  const top = Math.max(...y, p.goal?.value ?? 0);
  const LEVEL: Record<string, string> = {
    sitting: "seduto",
    mixed: "misto",
    on_feet: "in piedi",
  };
  return {
    title: "Passi",
    of: { fam: "habit", kind: "steps" },
    context:
      logged.length === 0
        ? "nessun giorno con i passi"
        : F.plural(logged.length, "giorno", "giorni") + " di " + p.period.length,
    head: {
      fam: "habit",
      sub: "steps",
      title: "Il periodo",
      ...(mean !== null ? { value: F.n(Math.round(mean / 100) * 100, 0) } : {}),
      meta: "senza voto per ora",
    },
    stats:
      mean === null
        ? []
        : [
            { l: "Media", v: F.n(Math.round(mean / 100) * 100, 0), u: "passi al giorno" },
            ...(p.goal
              ? [
                  {
                    l: "All’obiettivo",
                    v: hit + " su " + goalDays.length,
                    u: p.goal.weekdaysOnly ? "giorni feriali" : "giorni",
                  },
                ]
              : []),
            { l: "Il massimo", v: F.n(Math.max(...y), 0), u: "passi" },
          ],
    chart:
      logged.length === 0
        ? null
        : {
            type: "bars",
            data: {
              x: labels(p.period),
              y,
              unit: "passi",
              lo: 0,
              hi: roundUp(top * 1.1, 1000),
              ...(p.goal
                ? {
                    bandLo: p.goal.value,
                    bandHi: roundUp(top * 1.1, 1000),
                    ticks: [p.goal.value],
                  }
                : {}),
              decimals: 0,
            },
            caption: p.goal
              ? "Ogni barra un giorno; la fascia parte dall’obiettivo."
              : "Ogni barra un giorno.",
          },
    rowsTitle: "I giorni",
    rowsNote: "I passi entrano nel consumo del giorno (Energia).",
    rows: [...entries].reverse().map((e) => {
      const level = e.item.values["level"];
      return {
        fam: "habit",
        sub: "steps",
        title: F.Day(e.day),
        value: F.n(e.n, 0),
        ...(typeof level === "string" && LEVEL[level] ? { meta: LEVEL[level] } : {}),
        href: "/voce/" + e.item.id,
        hrefLabel: "I passi di " + F.day(e.day),
      };
    }),
    about:
      "Come giudicare i passi lo decide il dossier sul movimento: per ora solo i numeri.",
  };
}

/**
 * A kind of the person's own (V-14): each day its first number summed (with
 * its unit), or how many times when it has none; each entry a row as Oggi
 * shows it (its fields with their words). No score: the person has not
 * said what good is for it.
 */
export function kindTracker(p: {
  kind: Kind;
  days: readonly Day[];
  period: readonly string[];
}): TrackerView {
  const k = p.kind;
  const name = k.name ?? k.key;
  const head = k.fields.find((f) => ["number", "integer", "duration"].includes(f.type));
  const unit = head ? (head.type === "duration" ? "min" : (head.unit ?? "")) : "";
  const entries = p.days.flatMap((d) =>
    items(d)
      .filter((i) => i.kind.key === k.key && done(i))
      .map((i) => ({ day: d.day, item: i })),
  );
  const by = new Map<string, number>();
  for (const e of entries)
    by.set(
      e.day,
      (by.get(e.day) ?? 0) + (head ? (num(e.item.values[head.key]) ?? 0) : 1),
    );
  const logged = p.period.filter((d) => by.has(d));
  const y = p.period.map((d) => by.get(d) ?? 0);
  const total = y.reduce((a, b) => a + b, 0);
  const what = head ? (head.label ?? head.key).toLowerCase() : "volte";
  return {
    title: name,
    of: { fam: k.family, kind: k.key },
    context:
      entries.length === 0
        ? "niente nel periodo"
        : F.plural(entries.length, "volta", "volte") +
          " in " +
          F.plural(logged.length, "giorno", "giorni"),
    head: {
      fam: k.family,
      title: "Il periodo",
      ...(entries.length ? { value: head ? F.num(total, unit) : String(total) } : {}),
      meta: "senza voto: è un tracker tuo",
    },
    stats: entries.length
      ? [
          { l: "Giorni", v: String(logged.length), u: "su " + p.period.length },
          {
            l: "Al giorno",
            v: F.n(total / Math.max(1, logged.length), head ? 1 : 1),
            u: (head ? unit || what : "volte") + ", nei giorni segnati",
          },
          {
            l: "Il massimo",
            v: F.n(Math.max(...y), head ? 1 : 0),
            u: head ? unit || what : "volte",
          },
        ]
      : [],
    chart:
      entries.length === 0
        ? null
        : {
            type: "bars",
            data: {
              x: labels(p.period),
              y,
              unit: head ? unit : "volte",
              lo: 0,
              hi: Math.max(1, Math.ceil(Math.max(...y) * 1.15)),
              decimals: head ? 1 : 0,
            },
            caption: head
              ? "Ogni barra un giorno: " +
                what +
                (unit ? " (" + unit + ")" : "") +
                ", sommati."
              : "Ogni barra un giorno: quante volte.",
          },
    rowsTitle: "Le volte",
    rowsNote: "Ognuna con quello che hai segnato.",
    rows: [...entries].reverse().map((e) => ({
      ...present(e.item),
      title: F.Day(e.day),
      href: "/voce/" + e.item.id,
      hrefLabel: name + " di " + F.day(e.day),
    })),
    about: "Un tracker tuo: lo cambi o lo archivi in Impostazioni → Tracker e tipi.",
  };
}
