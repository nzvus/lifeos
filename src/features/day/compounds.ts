/**
 * features/day/compounds.ts — caffeine and creatine on the day as the boards
 * draw them (Main board; dossiers/ranges.md §6), not as foods with grams:
 *   a coffee alone  «Caffè ≈ 100 mg», «a letto ne restano ≈ 13 mg» (the
 *                   day's caffeine halving every 5 h, at bedtime);
 *   creatine alone  «Creatina 3,4 g», «integratore · scorte ≈ 76 % · in aumento»
 *                   (the stores day by day, core/food/creatine; FOOD-40);
 *   inside a meal   a pill: «≈ 100 mg» with the coffee's mark, «creatina 3,4 g».
 * Bedtime: the night's sleep when it is logged, else his usual (the median of
 * his nights, «di solito 00:30»), else 23:30. A coffee's pill only when it
 * matters (FOOD-40, UI-73): what is left at bedtime is not good (EFSA 2015:
 * under 50 mg good, over 100 bad), the coffee is after the last-coffee time
 * (bed − 9 h, − 13 h over 150 mg; Gardiner 2023), the day passes 400 mg or the
 * dose 200 mg. A morning coffee says only its milligrams.
 */
const LEVEL_STATE = { good: "good", fair: "warn", bad: "bad", danger: "danger" } as const;
import { F, type BoxEntry } from "@lifeos/kit";
import type { DayItem } from "@/core/day";
import {
  caffeineLeft,
  DAY_MAX_MG,
  DOSE_MAX_MG,
  lastDoseAt,
  mealCompounds,
} from "@/core/food/compounds";
import { creatineWords, type CreatineState } from "@/core/food/creatine";
import { caffeineBedRange, levelAt, LEVEL_WORDS } from "@/core/engines/targets";
import { lineTotals } from "@/core/food/totals";
import { isEaten } from "@/core/kinds";

export type CompoundContext = {
  compounds: ReadonlyMap<string, Record<string, string>>;
  /** Every caffeine dose of the day, for what is left at bedtime. */
  doses: readonly { at: Date; mg: number }[];
  /** Tonight's bed: logged (`known`), his usual (`usual`), else 23:30. */
  bed: { at: Date; known: boolean; usual?: boolean } | null;
  /** An instant as his clock says it («00:28»); the zone's, given by the page. */
  timeOf?: (d: Date) => string;
  /** The creatine stores on the day (core/food/creatine); null when none in the window. */
  creatine: CreatineState | null;
};

const servingsOf = (i: DayItem) =>
  typeof i.values["servings"] === "string" ? i.values["servings"] : null;

export function compoundsOf(i: DayItem, compounds: CompoundContext["compounds"]) {
  return isEaten(i.kind.key)
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
    const notes = caffeineNotes(c.caffeine, i, ctx);
    return {
      ...entry,
      fam: "drink",
      sub: "coffee",
      of: { fam: "drink", kind: "coffee" },
      title: "Caffè",
      value: F.approx(c.caffeine, "mg"),
      pills: notes.pills,
      meta: notes.meta,
    };
  }
  if (alone && c.creatine > 0)
    return {
      ...entry,
      fam: "habit",
      of: { fam: "drink", kind: "supplement" },
      title: "Creatina",
      value: F.num(c.creatine, "g"),
      meta: "integratore" + (ctx.creatine ? " · " + creatineWords(ctx.creatine) : ""),
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

/** «a letto (di solito 00:30)», «alle 23:30»: how bedtime is said. */
function bedWords(
  bed: NonNullable<CompoundContext["bed"]>,
  clock: (d: Date) => string,
): string {
  if (bed.known) return "a letto";
  return bed.usual
    ? "a letto (di solito " + clock(bed.at) + ")"
    : "alle " + clock(bed.at);
}

/** What a coffee's row says beyond its mg, only when it changes something. */
function caffeineNotes(
  mg: number,
  i: DayItem,
  ctx: CompoundContext,
): { pills: NonNullable<BoxEntry["pills"]>; meta: string } {
  const pills: NonNullable<BoxEntry["pills"]> = [];
  const meta: string[] = [];
  const day = ctx.doses.reduce((a, d) => a + d.mg, 0);
  if (ctx.bed) {
    const clock =
      ctx.timeOf ??
      ((d: Date) =>
        d.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Rome",
        }));
    const left = caffeineLeft(ctx.doses, ctx.bed.at);
    const level = levelAt(left, caffeineBedRange());
    if (level !== "good") {
      pills.push({
        t: bedWords(ctx.bed, clock) + ": " + LEVEL_WORDS[level],
        state: LEVEL_STATE[level],
      });
      meta.push("ne restano " + F.approx(left, "mg"));
    }
    const last = lastDoseAt(ctx.bed.at, mg);
    if (i.start && i.start.getTime() > last.getTime()) {
      pills.push({ t: "dopo le " + clock(last) + ": tocca il sonno", state: "warn" });
    }
  }
  if (day > DAY_MAX_MG)
    pills.push({ t: "oggi " + F.approx(day, "mg") + ": oltre 400", state: "bad" });
  else if (mg > DOSE_MAX_MG)
    pills.push({ t: "oltre 200 mg in una volta", state: "warn" });
  return { pills, meta: meta.join(" · ") };
}
