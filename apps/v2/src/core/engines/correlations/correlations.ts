/**
 * E8 Correlations (engines.md E8): pairs of daily (or per-session) metrics,
 * after at least 21 paired days.
 * - Spearman ρ, with a bootstrap 95 % interval;
 * - lagged pairs: x on a day against y `lag` days later (today's caffeine
 *   after 14:00 → tonight's sleep is lag 0 when the night ends on the same
 *   logical day, lag 1 otherwise);
 * - "may be chance" when the interval crosses 0;
 * - never advice: the output is numbers and their uncertainty.
 * Pure and repeatable: the bootstrap draws from a seeded generator.
 */
import type { IsoDate } from "../time/date";
import { addDays } from "../time/date";

export const MIN_PAIRS = 21;
const BOOTSTRAP = 1000;

/** Average ranks (ties share the mean of their ranks), 1-based. */
export function ranks(xs: readonly number[]): number[] {
  const order = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
  const out = new Array<number>(xs.length);
  for (let i = 0; i < order.length;) {
    let j = i;
    while (j + 1 < order.length && order[j + 1]!.x === order[i]!.x) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[order[k]!.i] = r;
    i = j + 1;
  }
  return out;
}

function pearson(a: readonly number[], b: readonly number[]): number | null {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let i = 0; i < n; i++) {
    sab += (a[i]! - ma) * (b[i]! - mb);
    saa += (a[i]! - ma) ** 2;
    sbb += (b[i]! - mb) ** 2;
  }
  return saa === 0 || sbb === 0 ? null : sab / Math.sqrt(saa * sbb);
}

/** Spearman's ρ: Pearson on the ranks; null when either side does not vary. */
export function spearman(x: readonly number[], y: readonly number[]): number | null {
  if (x.length !== y.length || x.length < 3) return null;
  return pearson(ranks(x), ranks(y));
}

/** A small deterministic generator (Park–Miller), so the interval is the same on every read. */
function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}

export type Correlation = {
  x: string;
  y: string;
  lag: number;
  n: number;
  rho: number;
  low: number;
  high: number;
  /** The 95 % interval crosses 0. */
  mayBeChance: boolean;
};

/** The paired values: x on day d, y on day d + lag; days missing either are left out. */
export function pairs(
  x: ReadonlyMap<IsoDate, number>,
  y: ReadonlyMap<IsoDate, number>,
  lag = 0,
): { x: number[]; y: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [d, v] of [...x].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const w = y.get(addDays(d, lag));
    if (w === undefined) continue;
    xs.push(v);
    ys.push(w);
  }
  return { x: xs, y: ys };
}

export function correlate(p: {
  x: { key: string; byDay: ReadonlyMap<IsoDate, number> };
  y: { key: string; byDay: ReadonlyMap<IsoDate, number> };
  lag?: number | undefined;
  seed?: number | undefined;
}): Correlation | null {
  const lag = p.lag ?? 0;
  const { x, y } = pairs(p.x.byDay, p.y.byDay, lag);
  if (x.length < MIN_PAIRS) return null;
  const rho = spearman(x, y);
  if (rho === null) return null;
  const r = rng(p.seed ?? 1);
  const boots: number[] = [];
  for (let b = 0; b < BOOTSTRAP; b++) {
    const bx: number[] = [];
    const by: number[] = [];
    for (let i = 0; i < x.length; i++) {
      const j = Math.floor(r() * x.length);
      bx.push(x[j]!);
      by.push(y[j]!);
    }
    const v = spearman(bx, by);
    if (v !== null) boots.push(v);
  }
  boots.sort((a, b) => a - b);
  const q = (f: number) =>
    boots[Math.min(boots.length - 1, Math.max(0, Math.round(f * (boots.length - 1))))]!;
  const low = q(0.025);
  const high = q(0.975);
  return {
    x: p.x.key,
    y: p.y.key,
    lag,
    n: x.length,
    rho,
    low,
    high,
    mayBeChance: low <= 0 && high >= 0,
  };
}
