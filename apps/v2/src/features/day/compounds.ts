/**
 * features/day/compounds.ts — caffeine and creatine on the day as the boards
 * draw them (Main board; dossiers/ranges.md §6), not as foods with grams:
 *   a coffee alone  «Caffè ≈ 100 mg», «a letto ne restano ≈ 13 mg» (the
 *                   day's caffeine halving every 5 h, at bedtime);
 *   creatine alone  «Creatina 3,4 g», «integratore · 11 giorni su 28»;
 *   inside a meal   a pill: «≈ 100 mg» with the coffee's mark, «creatina 3,4 g».
 * Bedtime: the night's sleep when it is logged, else 23:30, said as such.
 */
import { F, type BoxEntry } from "@lifeos/kit";
import type { DayItem } from "@/core/day";
import { caffeineLeft, mealCompounds } from "@/core/food/compounds";
import { lineTotals } from "@/core/food/totals";

export type CompoundContext = {
  compounds: ReadonlyMap<string, Record<string, string>>;
  /** Every caffeine dose of the day, for what is left at bedtime. */
  doses: readonly { at: Date; mg: number }[];
  bed: { at: Date; known: boolean } | null;
  /** Days of the last 28 with ≥ 3 g of creatine; null when never taken. */
  creatineDays: number | null;
};

const servingsOf = (i: DayItem) =>
  typeof i.values["servings"] === "string" ? i.values["servings"] : null;

export function compoundsOf(i: DayItem, compounds: CompoundContext["compounds"]) {
  return i.kind.key === "meal"
    ? mealCompounds(i.lines, servingsOf(i), compounds)
    : { caffeine: 0, creatine: 0 };
}

/** The day's caffeine doses: each timed meal carrying caffeine. */
export function caffeineDoses(
  items: readonly DayItem[],
  compounds: CompoundContext["compounds"],
): { at: Date; mg: number }[] {
  return items.flatMap((i) => {
    const mg = compoundsOf(i, compounds).caffeine;
    return mg > 0 && i.start && i.status === "done" ? [{ at: i.start, mg }] : [];
  });
}

export function withCompounds(
  entry: BoxEntry,
  i: DayItem,
  ctx: CompoundContext,
): BoxEntry {
  const c = compoundsOf(i, ctx.compounds);
  if (c.caffeine === 0 && c.creatine === 0) return entry;
  const kcal = Number(lineTotals(i.lines, servingsOf(i))["kcal"] ?? 0);
  const alone = kcal === 0;
  if (alone && c.caffeine > 0) {
    const left = ctx.bed ? caffeineLeft(ctx.doses, ctx.bed.at) : null;
    return {
      ...entry,
      fam: "drink",
      sub: "coffee",
      of: { fam: "drink", kind: "coffee" },
      title: "Caffè",
      value: F.approx(c.caffeine, "mg"),
      meta:
        left === null || !ctx.bed
          ? ""
          : (ctx.bed.known ? "a letto" : "alle " + F.time(23 * 60 + 30)) +
            " ne restano " +
            F.approx(left, "mg"),
    };
  }
  if (alone && c.creatine > 0)
    return {
      ...entry,
      fam: "habit",
      of: { fam: "drink", kind: "supplement" },
      title: "Creatina",
      value: F.num(c.creatine, "g"),
      meta:
        "integratore" +
        (ctx.creatineDays === null ? "" : " · " + ctx.creatineDays + " giorni su 28"),
    };
  return {
    ...entry,
    pills: [
      ...(entry.pills ?? []),
      ...(c.caffeine > 0
        ? [{ t: F.approx(c.caffeine, "mg"), of: { fam: "drink", kind: "coffee" } }]
        : []),
      ...(c.creatine > 0 ? [{ t: "creatina " + F.num(c.creatine, "g") }] : []),
    ],
  };
}
