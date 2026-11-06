/**
 * The weighing score's parts (E7 "weighing", engines.md), 0–1. The number
 * on the scale is never judged.
 *   reliable     the weigh-in's reliability (readWeighIn): 1 fasted, after
 *                the toilet, at a known hour; lowered by each clue
 *   pace         the actual pace (kg a week, the goal's progress) against
 *                the one the goal needs, in its direction, no faster than
 *                1 % of the weight a week (Helms 2014: faster losses cost
 *                lean mass): 1 from 0.8 × the needed pace up to that cap,
 *                0 at 0.5 % a week outside. A goal within 0.3 kg is kept:
 *                ±0.25 % a week. Null without a goal with a date or a pace
 *   consistency  days weighed in the last 7, not implausible: 5 of them
 *                count as full (Zheng 2015: near-daily weighing goes with
 *                better outcomes)
 * The 0.8, the 0.5 % floor and the 5 days are this engine's choices.
 */
import { addDays, type IsoDate } from "../time/date";
import { bandScore } from "../judgements/model";
import { implausibleWeighIns } from "./weigh-in";

const MAX_PCT = 0.01;
const KEEP_PCT = 0.0025;
const TOLERANCE_PCT = 0.005;
const SLOWER = 0.8;
const KEEP_KG = 0.3;
const FULL_DAYS = 5;

export type Pace = {
  nowKg: number;
  /** kg a week, negative when losing; null without enough weigh-ins. */
  actual: number | null;
  /** kg a week the goal asks; null without a date. */
  needed: number | null;
  /** The goal's target, kg. */
  target: number;
};

/** The band of paces, kg a week, that count as on the goal's way. */
export function paceBand(p: Omit<Pace, "actual">): { low: number; high: number } | null {
  const keep = KEEP_PCT * p.nowKg;
  if (Math.abs(p.target - p.nowKg) < KEEP_KG) return { low: -keep, high: keep };
  if (p.needed === null || p.needed === 0) return null;
  const cap = MAX_PCT * p.nowKg;
  const low = Math.min(SLOWER * Math.abs(p.needed), cap);
  return p.needed > 0 ? { low, high: cap } : { low: -cap, high: -low };
}

export function weighingParts(p: {
  reliability: number;
  pace: Pace | null;
  /** Weigh-ins oldest first, up to `today`. */
  series: readonly { day: IsoDate; kg: number }[];
  today: IsoDate;
}): { reliable: number; pace: number | null; consistency: number; days: number } {
  let pace: number | null = null;
  if (p.pace && p.pace.actual !== null) {
    const band = paceBand(p.pace);
    if (band) pace = bandScore(p.pace.actual, band, TOLERANCE_PCT * p.pace.nowKg);
  }
  const flags = implausibleWeighIns(p.series);
  const from = addDays(p.today, -7);
  const days = new Set(
    p.series
      .filter((w, i) => !flags[i] && w.day > from && w.day <= p.today)
      .map((w) => w.day),
  ).size;
  return {
    reliable: Math.min(1, Math.max(0, p.reliability)),
    pace,
    consistency: Math.min(1, days / FULL_DAYS),
    days,
  };
}
