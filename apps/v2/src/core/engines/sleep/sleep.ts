/**
 * The sleep score's parts (E7 "sleep", engines.md), 0–1. A night is its bed
 * and wake times as minutes of the day it ends on (bed at 22:30 the evening
 * before is −90), so nights compare across midnight.
 *   duration    hours slept against the need, 7–9 h for adults 18–64
 *               (Hirshkowitz 2015); 0 at 2 h outside it (5 h, 11 h)
 *   regularity  bed and wake against the mean of the 7 nights before, mean
 *               of the two gaps: 1 within 30 min, 0 at 2 h (Windred 2024:
 *               regularity predicts mortality better than duration). Needs
 *               3 nights before; else null
 *   feel        the night's quality and the morning check-in's energy, 1–5,
 *               their mean; null when neither was said
 * The 30-minute band and the 2-hour floors are this engine's choices.
 */
import { bandScore } from "../judgements/model";

export type Night = { bed: number; wake: number };

export const NEED_H = { low: 7, high: 9 };
const DURATION_TOLERANCE_H = 2;
const REGULAR_MIN = 30;
const REGULARITY_TOLERANCE_MIN = 90;
const MIN_NIGHTS = 3;

const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const scale5 = (x: number) => Math.min(1, Math.max(0, (x - 1) / 4));

export function sleepParts(p: {
  night: Night;
  /** The nights before it, at most 7 are read. */
  before: readonly Night[];
  quality: number | null;
  energy: number | null;
}): {
  duration: number;
  regularity: number | null;
  feel: number | null;
  /** The gap from the usual times, minutes; null with too few nights. */
  gapMin: number | null;
} {
  const hours = (p.night.wake - p.night.bed) / 60;
  const duration = bandScore(hours, NEED_H, DURATION_TOLERANCE_H);
  const last = p.before.slice(-7);
  const gapMin =
    last.length >= MIN_NIGHTS
      ? (Math.abs(p.night.bed - mean(last.map((n) => n.bed))) +
          Math.abs(p.night.wake - mean(last.map((n) => n.wake)))) /
        2
      : null;
  const regularity =
    gapMin === null
      ? null
      : bandScore(gapMin, { high: REGULAR_MIN }, REGULARITY_TOLERANCE_MIN);
  const said = [p.quality, p.energy].filter((x): x is number => x !== null);
  const feel = said.length ? mean(said.map(scale5)) : null;
  return { duration, regularity, feel, gapMin };
}
