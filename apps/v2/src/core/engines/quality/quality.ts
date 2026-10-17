/**
 * E9 Data quality (engines.md E9), for every kind: missing days, values out
 * of the field's range, duplicates, sudden unit-like jumps (×2, ×10, ÷1000)
 * and the estimated share. Shown in Review → Data quality, and before
 * saving where cheap (E6's flags). The dumbbell loads of 2026-10-15 (typed
 * per dumbbell where the total was meant) are its first case.
 */
import type { IsoDate } from "../time/date";
import type { Window } from "../time/window";
import { daysOf } from "../time/window";

export type QualityEntry = {
  id: string;
  day: IsoDate;
  /** Local minute, when known: duplicates compare it. */
  minute?: number | undefined;
  value: number;
  /** Confidence below 1, or an estimate (concepts §3). */
  estimated?: boolean | undefined;
};

export type Issue =
  | { type: "missing"; days: IsoDate[] }
  | {
      type: "outOfRange";
      id: string;
      value: number;
      min: number | undefined;
      max: number | undefined;
    }
  | { type: "duplicate"; id: string; of: string }
  | { type: "unitJump"; id: string; factor: number; previous: number; value: number };

/**
 * The factors a slip of unit makes (g for kg, ml for l). ×2 is a slip only for fields typed per
 * side or per dumbbell (loads): steps or kcal doubling is a real day, so a field opts in.
 */
export const UNIT_FACTORS = [10, 1000] as const;
export const PER_SIDE_FACTORS = [2, 10, 1000] as const;
/** How close a ratio must be to a factor to count. */
const CLOSE = 0.12;

export type QualityReport = {
  issues: Issue[];
  /** Share of the entries that are estimates, 0–1; null without entries. */
  estimatedShare: number | null;
};

/**
 * One field of one kind over a window. `expected` days are those the kind should have a value on
 * (a daily kind: every day; a habit: its planned days); `range` is the field's declared min/max.
 */
export function quality(p: {
  entries: readonly QualityEntry[];
  window: Window;
  expected?: (d: IsoDate) => boolean;
  range?: { min?: number | undefined; max?: number | undefined } | undefined;
  factors?: readonly number[] | undefined;
}): QualityReport {
  const factors = p.factors ?? UNIT_FACTORS;
  const issues: Issue[] = [];
  const inside = p.entries
    .filter((e) => e.day >= p.window.from && e.day <= p.window.to)
    .sort((a, b) =>
      a.day === b.day ? (a.minute ?? 0) - (b.minute ?? 0) : a.day < b.day ? -1 : 1,
    );
  if (p.expected) {
    const have = new Set(inside.map((e) => e.day));
    const missing = daysOf(p.window).filter((d) => p.expected!(d) && !have.has(d));
    if (missing.length) issues.push({ type: "missing", days: missing });
  }
  const { min, max } = p.range ?? {};
  for (const e of inside)
    if ((min !== undefined && e.value < min) || (max !== undefined && e.value > max))
      issues.push({ type: "outOfRange", id: e.id, value: e.value, min, max });
  const seen = new Map<string, string>();
  for (const e of inside) {
    const k = `${e.day}|${e.minute ?? ""}|${e.value}`;
    const first = seen.get(k);
    if (first) issues.push({ type: "duplicate", id: e.id, of: first });
    else seen.set(k, e.id);
  }
  // A jump against the previous value that matches a unit factor either way.
  for (let i = 1; i < inside.length; i++) {
    const prev = inside[i - 1]!.value;
    const cur = inside[i]!.value;
    if (prev <= 0 || cur <= 0) continue;
    const ratio = cur / prev;
    for (const f of factors) {
      const r = ratio >= 1 ? ratio : 1 / ratio;
      if (Math.abs(r / f - 1) <= CLOSE) {
        issues.push({
          type: "unitJump",
          id: inside[i]!.id,
          factor: ratio >= 1 ? f : 1 / f,
          previous: prev,
          value: cur,
        });
        break;
      }
    }
  }
  return {
    issues,
    estimatedShare: inside.length
      ? inside.filter((e) => e.estimated).length / inside.length
      : null,
  };
}
