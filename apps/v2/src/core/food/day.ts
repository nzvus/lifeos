/**
 * core/food/day.ts — what a day's meals add up to, by the parity's rules
 * (migration.md, convert/parity.ts `food`): eaten is every done meal; the
 * plan adds the planned ones not left out. Exact, through `lineTotals`.
 * Also where each nutrient came from (the eaten lines by name, largest
 * first) and the eaten macros' kinds.
 */
import Big from "big.js";
import { macroKinds, MACROS, type MacroKinds } from "./kinds";
import { lineTotals, type SnapshotLine } from "./totals";

export type FoodEntry = {
  status: "planned" | "done" | "skipped";
  leftOut: boolean;
  servings: string | null;
  lines: readonly (SnapshotLine & { name: string; kinds?: Record<string, string> })[];
};

export type DayFood = {
  /** Field → exact total of the done meals. */
  eaten: Record<string, string>;
  /** Field → exact total of the planned meals still in the plan. */
  planned: Record<string, string>;
  /** Field → the eaten lines by name, summed, largest first. */
  sources: Record<string, { name: string; amount: string }[]>;
  /** The eaten macros split into their kinds (core/food/kinds). */
  kinds: MacroKinds;
};

function add(into: Map<string, Big>, totals: Record<string, string>) {
  for (const [f, v] of Object.entries(totals))
    into.set(f, (into.get(f) ?? new Big(0)).plus(v));
}

const plain = (m: Map<string, Big>) =>
  Object.fromEntries([...m].map(([f, v]) => [f, v.toString()]));

export function dayFood(entries: readonly FoodEntry[]): DayFood {
  const eaten = new Map<string, Big>();
  const planned = new Map<string, Big>();
  const bySource = new Map<string, Map<string, Big>>();
  const kinds = Object.fromEntries(MACROS.map((m) => [m, {}])) as MacroKinds;
  for (const e of entries) {
    if (e.status === "planned" && !e.leftOut)
      add(planned, lineTotals(e.lines, e.servings));
    if (e.status !== "done") continue;
    add(eaten, lineTotals(e.lines, e.servings));
    const split = macroKinds(e.lines, e.servings);
    for (const m of MACROS)
      for (const [k, g] of Object.entries(split[m])) kinds[m][k] = (kinds[m][k] ?? 0) + g;
    for (const l of e.lines)
      for (const [f, v] of Object.entries(lineTotals([l], e.servings))) {
        const names = bySource.get(f) ?? new Map<string, Big>();
        names.set(l.name, (names.get(l.name) ?? new Big(0)).plus(v));
        bySource.set(f, names);
      }
  }
  const sources = Object.fromEntries(
    [...bySource].map(([f, names]) => [
      f,
      [...names]
        .filter(([, v]) => v.gt(0))
        .sort(([, a], [, b]) => b.cmp(a))
        .map(([name, v]) => ({ name, amount: v.toString() })),
    ]),
  );
  return { eaten: plain(eaten), planned: plain(planned), sources, kinds };
}
