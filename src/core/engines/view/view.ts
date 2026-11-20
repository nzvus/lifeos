/**
 * The visualization engine (MOD-56), second layer: a page's **request** (frame, level) and a
 * measure's data give a **view** — a description, not a drawing. Only the kit draws it
 * (`MeasureView`, PRD-18, PAT-53). The one rule (bars-study §17.1): `view = family(reading,
 * frame) at level`. Pure; the data comes in already computed (the metrics engine's job).
 *
 * Built: amount, time, rating, composition, score (slice 2); done — yes / no for any class
 * (slice 3, bars-study §19.1). category · presence give `none` until their slice.
 */
import type { Reading } from "./readings";

/** The whole a measure is drawn against, chosen by the page (MOD-56). */
export type Frame = "own" | "day" | "session" | "period";
/** How much is shown: 0 a glance, 1 open (references, parts with their names), 2 everything. */
export type Level = 0 | 1 | 2;
export type ViewRequest = { frame: Frame; level: Level };

export type ZoneLevel = "danger" | "bad" | "fair" | "good";
export type Zone = { from: number; level: ZoneLevel };

export type Part = {
  name: string;
  short?: string;
  v: number;
  /** A ceiling of its own (a criterion's weight in points). */
  max?: number;
  zones?: Zone[];
  color?: string;
};

/** A day of a yes / no measure, in VIS-22's states; «missed» = nothing logged, nothing planned. */
export type DayState = "done" | "planned" | "skipped" | "missed";

/** One measure with everything already computed for the frame asked. */
export type MeasureInput = {
  name: string;
  reading: Reading;
  unit?: string;
  /** null = no data: nothing is drawn (PRD-22). */
  v: number | null;
  /** Planned on top of `v` (VIS-22). */
  plan?: number;
  /** Identity colour, a token (`var(--…)`); never a judgement (bars-study §16.3). */
  color?: string;
  /** References of the day or the session; an object alone (`own`) is never judged by them. */
  refs?: { target?: number; zones?: Zone[]; max?: number };
  /** Parts that add up to it (composition, a voto's criteria) or members judged alone. */
  parts?: Part[];
  partsAdd?: boolean;
  /** Over a period: one value per day. */
  days?: { d: string; v: number; plan?: number }[];
  /** Yes / no: today's state (frame day), or one per day (frame period). */
  state?: DayState;
  states?: { d: string; s: DayState }[];
  /** A month's first weekday (Monday 0): blank cells before its first day. */
  lead?: number;
  /** Coverage below its need → «non so» (MOD-41, PRD-23). */
  coverage?: { have: number; need: number; missing: string[] };
};

export type ViewNode = {
  name: string;
  short?: string;
  v: number;
  plan?: number;
  max?: number;
  t?: number;
  unit?: string;
  zones?: Zone[];
  color: string;
  children?: { adds: boolean; nodes: ViewNode[] };
};

export type View =
  /** A bar on the frame's scale; its parts under it from level 1 (MeasureTree). */
  | { piece: "tree"; level: Level; node: ViewNode; depth: number }
  /** The same measure over a period, a column a day (MeasureDays). */
  | {
      piece: "days";
      level: Level;
      name: string;
      unit?: string;
      days: { d: string; v: number; plan?: number }[];
      t?: number;
      zones: Zone[];
      color: string;
    }
  /** A score at a glance: mark + number + word (Judge, VIS-43). */
  | { piece: "chip"; level: Level; name: string; score: number }
  /** Yes / no in a day: the voce's own shape, previsto · fatto · saltato (VIS-22), no bar. */
  | { piece: "state"; level: Level; name: string; state: DayState; color: string }
  /**
   * Yes / no over a period: a cell a day (a week in a row, a month as a calendar), or a goal's
   * n cells with the done ones filled; the streak = the done days that end the period.
   */
  | {
      piece: "cells";
      level: Level;
      name: string;
      grid: "week" | "month" | "goal";
      cells: { d: string; s: DayState }[];
      streak: number;
      color: string;
      lead: number;
    }
  /** Below coverage: «non so» and what is missing (Unknown, PAT-55). */
  | { piece: "unknown"; level: Level; name: string; missing: string[] }
  /** Nothing to draw: no data, or a reading not built yet. */
  | { piece: "none"; reason: "no-data" | "not-built" };

const INK = "var(--ink)";
/** A score's ruler: «in parte» from 40, «raggiunto» from 70 (PAT-52). */
export const SCORE_ZONES: Zone[] = [
  { from: 0, level: "bad" },
  { from: 40, level: "fair" },
  { from: 70, level: "good" },
];
const DRAWN: Reading[] = ["amount", "time", "rating", "composition", "score", "done"];

/** The done days that end the period (a planned or missed today does not break it yet). */
export function streakOf(states: { s: DayState }[]): number {
  const last = states.at(-1)?.s;
  let i = states.length - (last === "planned" || last === "missed" ? 2 : 1);
  let n = 0;
  for (; i >= 0 && states[i]!.s === "done"; i--) n++;
  return n;
}

/**
 * An intake's reading from its logs (bars-study §19.1, his «la creatina: un valore costante che o
 * prendo una volta o no al giorno. la caffeina è diverso»): a dose that never changes (three logs
 * at least) says only «presa / non presa»; a judged one (caffeine's ≤ 400 mg) stays an amount.
 */
export function intakeReading(doses: number[], judged: boolean): "done" | "amount" {
  if (judged || doses.length < 3) return "amount";
  return doses.every((x) => x === doses[0]) ? "done" : "amount";
}

function doneView(m: MeasureInput, req: ViewRequest, color: string): View {
  const { frame, level } = req;
  if (frame !== "period") {
    const state = m.state ?? (m.v === null ? null : m.v > 0 ? "done" : "missed");
    if (!state) return { piece: "none", reason: "no-data" };
    return { piece: "state", level, name: m.name, state, color };
  }
  const states = m.states ?? [];
  if (!states.length) return { piece: "none", reason: "no-data" };
  const streak = streakOf(states);
  const n = m.refs?.target;
  if (n !== undefined) {
    // A goal «n volte»: n cells, the done ones first and filled; more done than n stay shown.
    const done = states.filter((x) => x.s === "done").length;
    const cells = Array.from({ length: Math.max(n, done) }, (_, i) => ({
      d: "",
      s: (i < done ? "done" : "missed") as DayState,
    }));
    return {
      piece: "cells",
      level,
      name: m.name,
      grid: "goal",
      cells,
      streak,
      color,
      lead: 0,
    };
  }
  const grid = states.length > 7 ? "month" : "week";
  const lead = grid === "month" ? (m.lead ?? 0) : 0;
  return {
    piece: "cells",
    level,
    name: m.name,
    grid,
    cells: states,
    streak,
    color,
    lead,
  };
}

function partNode(p: Part, color: string): ViewNode {
  return {
    name: p.name,
    v: p.v,
    color: p.color ?? color,
    ...(p.short ? { short: p.short } : {}),
    ...(p.max !== undefined ? { max: p.max } : {}),
    ...(p.zones ? { zones: p.zones } : {}),
  };
}

export function viewOf(m: MeasureInput, req: ViewRequest): View {
  const { frame, level } = req;
  if (!DRAWN.includes(m.reading)) return { piece: "none", reason: "not-built" };
  if (m.coverage && m.coverage.have < m.coverage.need)
    return { piece: "unknown", level, name: m.name, missing: m.coverage.missing };
  const color = m.color ?? INK;
  if (m.reading === "done") return doneView(m, req, color);
  const score = m.reading === "score";

  if (frame === "period") {
    if (!m.days?.length) return { piece: "none", reason: "no-data" };
    return {
      piece: "days",
      level,
      name: m.name,
      days: m.days,
      color,
      zones: score ? SCORE_ZONES : (m.refs?.zones ?? []),
      ...(m.unit ? { unit: m.unit } : {}),
      ...(score ? {} : m.refs?.target !== undefined ? { t: m.refs.target } : {}),
    };
  }

  if (m.v === null) return { piece: "none", reason: "no-data" };
  if (score && level === 0) return { piece: "chip", level, name: m.name, score: m.v };

  // An object alone is not judged by the day's references (bars-study §17.1, frame «own»);
  // a score carries its own ruler everywhere.
  const judged = frame !== "own";
  const zones = score ? SCORE_ZONES : judged ? m.refs?.zones : undefined;
  const max = score ? 100 : m.refs?.max;
  const node: ViewNode = {
    name: m.name,
    v: m.v,
    color,
    ...(m.unit ? { unit: m.unit } : {}),
    ...(m.plan ? { plan: m.plan } : {}),
    ...(max !== undefined ? { max } : {}),
    ...(judged && !score && m.refs?.target !== undefined ? { t: m.refs.target } : {}),
    ...(zones ? { zones } : {}),
    ...(m.parts?.length
      ? {
          children: {
            adds: m.partsAdd ?? (m.reading === "composition" || score),
            nodes: m.parts.map((p) => partNode(p, color)),
          },
        }
      : {}),
  };
  // Parts only from level 1, with their names (§17.3): at a glance a bar is one colour.
  return { piece: "tree", level, node, depth: level === 0 ? 0 : level };
}
