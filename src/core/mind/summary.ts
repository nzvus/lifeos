/**
 * core/mind/summary.ts — a period of check-ins at a glance (ADR-0038):
 * averages of mood, energy and stress over the days that said them, and
 * how many days were checked in. PURE.
 */
import type { Checkin } from "./repositories/checkins";

export type MindSummary = {
  days: number;
  mood: number | null;
  energy: number | null;
  stress: number | null;
};

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x !== null);
  return v.length
    ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10
    : null;
};

export function mindSummary(checkins: readonly Checkin[]): MindSummary {
  return {
    days: checkins.length,
    mood: avg(checkins.map((c) => c.mood)),
    energy: avg(checkins.map((c) => c.energy)),
    stress: avg(checkins.map((c) => c.stress)),
  };
}
