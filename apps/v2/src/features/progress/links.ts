/**
 * features/progress/links.ts — «Legami» (V-06 correlations, E8): pairs of
 * daily measures the person logs, after 21 paired days, as Spearman's ρ with
 * a bootstrap 95 % interval, in words; a pair short of days says how many it
 * has. Never advice: «va insieme a», and «potrebbe essere caso» when the
 * interval crosses zero. Pure: the page brings each measure by day.
 */
import {
  correlate,
  MIN_PAIRS,
  pairs,
  type Correlation,
} from "@/core/engines/correlations";
import type { IsoDate } from "@/core/engines/time";

export type Measure = { key: string; words: string; byDay: ReadonlyMap<IsoDate, number> };
export type LinkPair = { x: string; y: string; lag: 0 | 1; words: string };

/** The default pairs (kinds.md relations): sleep and the morning, the day and the night after. */
export const LINK_PAIRS: readonly LinkPair[] = [
  { x: "sleepH", y: "energy", lag: 0, words: "le ore di sonno e l’energia del mattino" },
  { x: "sleepH", y: "mood", lag: 0, words: "le ore di sonno e l’umore" },
  {
    x: "steps",
    y: "sleepH",
    lag: 1,
    words: "i passi del giorno e il sonno della notte dopo",
  },
  {
    x: "trainMin",
    y: "sleepH",
    lag: 1,
    words: "l’allenamento e il sonno della notte dopo",
  },
  {
    x: "trainMin",
    y: "energy",
    lag: 1,
    words: "l’allenamento e l’energia del giorno dopo",
  },
  { x: "stress", y: "sleepH", lag: 1, words: "lo stress e il sonno della notte dopo" },
];

export type LinkRow =
  | { pair: LinkPair; ready: true; c: Correlation; says: string }
  | { pair: LinkPair; ready: false; have: number; need: number };

const strength = (r: number) => {
  const a = Math.abs(r);
  return a < 0.2 ? "appena" : a < 0.4 ? "un po’" : a < 0.6 ? "abbastanza" : "molto";
};

export function links(measures: readonly Measure[], list = LINK_PAIRS): LinkRow[] {
  const by = new Map(measures.map((m) => [m.key, m]));
  return list.flatMap((pair): LinkRow[] => {
    const x = by.get(pair.x);
    const y = by.get(pair.y);
    if (!x || !y) return [];
    const have = pairs(x.byDay, y.byDay, pair.lag).x.length;
    const c = correlate({ x, y, lag: pair.lag });
    if (!c) return [{ pair, ready: false as const, have, need: MIN_PAIRS }];
    const dir = c.rho >= 0 ? "vanno insieme" : "vanno in senso opposto";
    const says = c.mayBeChance
      ? "Nessun legame chiaro: potrebbe essere caso."
      : `${x.words[0]!.toUpperCase() + x.words.slice(1)} e ${y.words} ${dir}, ${strength(c.rho)}.`;
    return [{ pair, ready: true as const, c, says }];
  });
}
