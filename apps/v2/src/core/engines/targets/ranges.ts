/**
 * E5 — ranges: how far from good each number is (dossiers/ranges.md, approved
 * as recommended 2026-10-24). A range is ordered zones on one number, each
 * from its edge up to the next one's, the last open:
 *   danger «da evitare» · bad «pessimo» · fair «ok» · good «ottimo».
 * Edges scale with the reference weight W (kg) and the day's energy E (kcal):
 *   protein   bad < 0.83 W (EFSA PRI) · fair · good 1.6–2.2 W (Morton 2018)
 *             · fair to 3.0 W · bad; without W, 10–35 % of E (EFSA/IOM)
 *   fat       bad < 15 % E · fair · good 20–35 % E (EFSA) · fair to 40 % · bad
 *   carbs     bad < 3 W (ACSM 2016; 5 W on a hard day), at most 45 % E · good
 *             to 60 % E (EFSA)
 *             · fair to 65 % · bad
 *   fibre     bad < 10 g/1 000 E · fair · good from 14 g/1 000 E and 25 g
 *             (EFSA, IOM) · fair past 60 g (GI symptoms)
 *   sugars    free sugars: good < 5 % E · fair to 10 % · bad · danger > 20 % (WHO)
 *   saturated good < 10 % E (WHO) · fair to 12 % · bad
 *   salt      good ≤ 5 g (WHO) · fair to 7.5 · bad · danger > 12.5
 *   micros    with a PRI: bad < AR · fair · good from the PRI; with an AI
 *             only: fair < AI, never bad (IOM 2000); danger past an UL that
 *             judges the total; sodium as salt (1.5× and 2.5× its 2 g)
 *   caffeine  good ≤ 400 mg a day · bad · danger > 600; at bedtime good
 *             < 50 mg · fair to 100 · bad (EFSA 2015)
 *   inulin    good ≤ 10 g · fair to 20 · bad (Bonnema 2010)
 * Edges past a guideline's one line (1.5× and 2.5× a limit, the 12 % of
 * saturated, 3.0 W of protein) are this engine's choices, said as such.
 * Score of a number, 0–1: good 1; fair from 1 at the good edge to 0.5 at
 * its far edge; bad from 0.5 to 0; danger 0. An open zone is as wide as
 * the zone before it.
 */
import type { MicroTarget } from "./micros";

export type Level = "danger" | "bad" | "fair" | "good";
export type Zone = { from: number; level: Level };
export type Range = { unit: string; zones: Zone[]; source: string };

export const LEVEL_WORDS: Record<Level, string> = {
  danger: "da evitare",
  bad: "pessimo",
  fair: "ok",
  good: "ottimo",
};

/** Zones from edges: [level, from][]; edges forced non-decreasing, empty zones dropped, equal neighbours merged. */
function zones(unit: string, source: string, list: [Level, number][]): Range {
  const out: Zone[] = [];
  let last = 0;
  for (const [level, at] of list) {
    const from = Math.max(last, at);
    last = from;
    if (out.length && out[out.length - 1]!.from === from) out.pop();
    if (out.length && out[out.length - 1]!.level === level) continue;
    out.push({ from, level });
  }
  return { unit, zones: out, source };
}

export function levelAt(v: number, r: Range): Level {
  let level = r.zones[0]!.level;
  for (const z of r.zones) if (v >= z.from) level = z.level;
  return level;
}

/**
 * `soFar`: a day still going is not judged for what it has yet to reach,
 * only for what it went over (dossiers/ranges.md §7): under its good zone
 * a number scores 1.
 */
export function rangeScore(v: number, r: Range, soFar = false): number {
  const zs = r.zones;
  const good = zs.find((z) => z.level === "good");
  if (soFar && good && v < good.from) return 1;
  let i = 0;
  for (let k = 0; k < zs.length; k++) if (v >= zs[k]!.from) i = k;
  const z = zs[i]!;
  if (z.level === "good") return 1;
  if (z.level === "danger") return 0;
  const lo = z.from;
  const hi = zs[i + 1]?.from ?? lo + (lo - (zs[i - 1]?.from ?? 0));
  // Which side the good zone is on: below (the zone climbs away from it) or above.
  const goodBelow = zs.slice(0, i).some((x) => x.level === "good");
  const span = hi - lo || 1;
  const far = goodBelow ? Math.min(1, (v - lo) / span) : Math.min(1, (hi - v) / span);
  const t = Math.max(0, far);
  return z.level === "fair" ? 1 - 0.5 * t : 0.5 - 0.5 * t;
}

export type DayBasis = {
  /** Reference weight, kg; null when unknown. */
  weightKg: number | null;
  /** The day's energy, kcal: its target, else what it holds. */
  kcal: number;
  hardDay?: boolean | undefined;
};

const pctE = (b: DayBasis, pct: number, kcalPerG: number) =>
  (b.kcal * pct) / 100 / kcalPerG;

export function proteinRange(b: DayBasis): Range {
  const W = b.weightKg;
  if (W === null)
    return zones("g", "EFSA/IOM, 10–35 % kcal", [
      ["bad", 0],
      ["good", pctE(b, 10, 4)],
      ["fair", pctE(b, 35, 4)],
    ]);
  return zones("g", "Morton 2018: 1,6–2,2 g/kg", [
    ["bad", 0],
    ["fair", 0.83 * W],
    ["good", 1.6 * W],
    ["fair", 2.2 * W],
    ["bad", 3.0 * W],
  ]);
}

export function fatRange(b: DayBasis): Range {
  return zones("g", "EFSA 2010: 20–35 % kcal", [
    ["bad", 0],
    ["fair", pctE(b, 15, 9)],
    ["good", pctE(b, 20, 9)],
    ["fair", pctE(b, 35, 9)],
    ["bad", pctE(b, 40, 9)],
  ]);
}

export function carbsRange(b: DayBasis): Range {
  // Per kg, but never past 45 % of the day's energy: a short day cannot ask 3 g/kg.
  const low = Math.min(
    pctE(b, 45, 4),
    b.weightKg === null ? Infinity : (b.hardDay ? 5 : 3) * b.weightKg,
  );
  return zones("g", "ACSM 2016: 3–5 g/kg; EFSA 2010: ≤ 60 % kcal", [
    ["bad", 0],
    ["good", low],
    ["fair", pctE(b, 60, 4)],
    ["bad", pctE(b, 65, 4)],
  ]);
}

export function fibreRange(b: DayBasis): Range {
  return zones("g", "EFSA 2010 e IOM 2005: 14 g/1.000 kcal, almeno 25 g", [
    ["bad", 0],
    ["fair", (10 * b.kcal) / 1000],
    ["good", Math.max(25, (14 * b.kcal) / 1000)],
    ["fair", 60],
  ]);
}

export function sugarsRange(b: DayBasis): Range {
  return zones("g", "OMS 2015: < 10 % kcal, meglio < 5 %", [
    ["good", 0],
    ["fair", pctE(b, 5, 4)],
    ["bad", pctE(b, 10, 4)],
    ["danger", pctE(b, 20, 4)],
  ]);
}

export function saturatedRange(b: DayBasis): Range {
  return zones("g", "OMS 2023: < 10 % kcal", [
    ["good", 0],
    ["fair", pctE(b, 10, 9)],
    ["bad", pctE(b, 12, 9)],
  ]);
}

/** A limit with one guideline line: fair to 1.5×, bad to 2.5×, then danger. */
function limit(unit: string, source: string, max: number): Range {
  return zones(unit, source, [
    ["good", 0],
    ["fair", max],
    ["bad", 1.5 * max],
    ["danger", 2.5 * max],
  ]);
}

export const saltRange = (): Range => limit("g", "OMS 2023: < 5 g", 5);

/** EFSA's average requirements (2017 summary), where a PRI is set. */
const AR: Partial<Record<MicroTarget["micro"], (t: MicroTarget) => number>> = {
  vitA: (t) => (t.value === 750 ? 570 : 490),
  vitC: (t) => (t.value === 110 ? 90 : 80),
  folate: () => 250,
  ca: (t) => (t.value === 1000 ? 860 : 750),
  fe: (t) => (t.value === 16 ? 7 : 6),
};

export function microRange(t: MicroTarget): Range {
  if (t.kind === "safe") return limit(t.unit, "EFSA 2019", t.value);
  const ul = t.upper && t.upper.scope === "total" ? t.upper.value : null;
  const list: [Level, number][] =
    t.kind === "PRI"
      ? [
          ["bad", 0],
          ["fair", AR[t.micro]?.(t) ?? t.value * 0.75],
          ["good", t.value],
        ]
      : [
          ["fair", 0],
          ["good", t.value],
        ];
  if (ul !== null) list.push(["danger", ul]);
  return zones(t.unit, "EFSA 2017", list);
}

export const caffeineDayRange = (): Range =>
  zones("mg", "EFSA 2015: fino a 400 mg", [
    ["good", 0],
    ["bad", 400],
    ["danger", 600],
  ]);

export const caffeineBedRange = (): Range =>
  zones("mg", "EFSA 2015; Drake 2013", [
    ["good", 0],
    ["fair", 50],
    ["bad", 100],
  ]);

export const inulinRange = (): Range =>
  zones("g", "Bonnema 2010", [
    ["good", 0],
    ["fair", 10],
    ["bad", 20],
  ]);
