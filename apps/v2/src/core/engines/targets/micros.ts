/**
 * E5 Targets — micronutrients for adults (engines.md E5; kinds.md's list).
 * Each target is EFSA's reference value for the person's sex and age:
 *   PRI   population reference intake (covers nearly everyone)
 *   AI    adequate intake (when a PRI cannot be set)
 *   safe  sodium's "safe and adequate intake" (EFSA 2019), read as an upper aim
 * and, where EFSA set one, the upper level with its scope: some apply only to
 * a form (preformed retinol, folic acid) or to supplements (magnesium salts),
 * so they never judge a day's food as a whole.
 * Sources (checked 2026-10-17):
 *   EFSA DRV summary report, 2017 (EFSA Supporting Publication 2017:e15121),
 *     tables 5, 7, 9, 11 and the magnesium AI;
 *   EFSA NDA 2019, sodium (EFSA Journal 2019;17(9):e05778);
 *   EFSA/SCF overview of ULs, version 11, August 2025: vitamin A and iron
 *     2024 (iron: a safe level, 40 mg), selenium 2023 (255 µg), calcium 2012,
 *     vitamin D 2023, folate 2023, iodine SCF 2003, magnesium SCF 2001.
 * Children, pregnancy and lactation have other values: not covered yet.
 */

export type Micro =
  | "vitA"
  | "vitC"
  | "vitD"
  | "b12"
  | "folate"
  | "ca"
  | "fe"
  | "mg"
  | "k"
  | "na"
  | "i"
  | "se";

export type MicroTarget = {
  micro: Micro;
  unit: "mg" | "µg";
  /** What the value is: PRI, AI, or a safe intake read as an upper aim. */
  kind: "PRI" | "AI" | "safe";
  value: number;
  upper: {
    value: number;
    kind: "UL" | "safe";
    /** What the upper level applies to; only "total" judges a day's food. */
    scope:
      | "total"
      | "preformed retinol"
      | "folic acid and its salts"
      | "supplements and added salts";
  } | null;
};

export const MICROS: readonly Micro[] = [
  "vitA",
  "vitC",
  "vitD",
  "b12",
  "folate",
  "ca",
  "fe",
  "mg",
  "k",
  "na",
  "i",
  "se",
];

export function microTargets(p: {
  sex: "male" | "female";
  age: number;
  /** Women's iron: 16 mg before the menopause, 11 after. Default: from 50 years. */
  postmenopausal?: boolean | undefined;
}): MicroTarget[] {
  if (!(p.age >= 18)) throw new RangeError(`adult values only (18+), got age ${p.age}`);
  const male = p.sex === "male";
  const post = p.postmenopausal ?? p.age >= 50;
  const t = (
    micro: Micro,
    unit: MicroTarget["unit"],
    kind: MicroTarget["kind"],
    value: number,
    upper: MicroTarget["upper"] = null,
  ): MicroTarget => ({ micro, unit, kind, value, upper });
  return [
    t("vitA", "µg", "PRI", male ? 750 : 650, {
      value: 3000,
      kind: "UL",
      scope: "preformed retinol",
    }),
    t("vitC", "mg", "PRI", male ? 110 : 95),
    t("vitD", "µg", "AI", 15, { value: 100, kind: "UL", scope: "total" }),
    t("b12", "µg", "AI", 4),
    t("folate", "µg", "PRI", 330, {
      value: 1000,
      kind: "UL",
      scope: "folic acid and its salts",
    }),
    t("ca", "mg", "PRI", p.age < 25 ? 1000 : 950, {
      value: 2500,
      kind: "UL",
      scope: "total",
    }),
    t("fe", "mg", "PRI", male || post ? 11 : 16, {
      value: 40,
      kind: "safe",
      scope: "total",
    }),
    t("mg", "mg", "AI", male ? 350 : 300, {
      value: 250,
      kind: "UL",
      scope: "supplements and added salts",
    }),
    t("k", "mg", "AI", 3500),
    t("na", "mg", "safe", 2000),
    t("i", "µg", "AI", 150, { value: 600, kind: "UL", scope: "total" }),
    t("se", "µg", "AI", 70, { value: 255, kind: "UL", scope: "total" }),
  ];
}

export type MicroState = "short" | "met" | "over";

/**
 * Where a day's (or a week's mean) intake stands. Sodium is an upper aim: met at or under it.
 * The others are met from their value; over only past an upper level whose scope is the total.
 */
export function microState(intake: number, t: MicroTarget): MicroState {
  if (t.kind === "safe") return intake <= t.value ? "met" : "over";
  if (t.upper && t.upper.scope === "total" && intake > t.upper.value) return "over";
  return intake >= t.value ? "met" : "short";
}
