/**
 * ui/MacroGrid.tsx — every nutrient of a label in two short rows, for a
 * preview (2026-10-04: "all the macros, compact but readable"). Each cell:
 * the nutrient's icon in its colour, a short name, the value in ink. Sugars
 * sit under carbs and saturated fat under fat ("of which"); the energy split
 * bar below.
 *
 *   🔥 kcal   🥩 Prot.   🌾 Carbo   💧 Grassi
 *   650       30 g       60 g       20 g
 *   🍃 Fibre  🧂 Sale    zucch.     saturi
 *   3 g       1,2 g      6 g        5 g
 */
import { MacroBar } from "./MacroBar";
import type { MacroStripLabels, MacroStripValues } from "./MacroStrip";
import { NutrientIcon } from "./NutrientIcon";

export type MacroShortLabels = Record<
  "kcal" | "protein" | "carbs" | "sugars" | "fat" | "saturatedFat" | "fiber" | "salt",
  string
>;

export function MacroGrid({
  values,
  labels,
  short,
}: {
  values: MacroStripValues;
  labels: MacroStripLabels;
  short: MacroShortLabels;
}) {
  const g = (v: string | undefined) => (v === undefined ? "—" : `${v} g`);
  const cells: { key: keyof MacroShortLabels; value: string; part?: boolean }[] = [
    { key: "kcal", value: values.energy ?? "—" },
    { key: "protein", value: g(values.protein) },
    { key: "carbs", value: g(values.carbs) },
    { key: "fat", value: g(values.fat) },
    { key: "fiber", value: g(values.fiber) },
    { key: "salt", value: g(values.salt) },
    { key: "sugars", value: g(values.sugars), part: true },
    { key: "saturatedFat", value: g(values.saturatedFat), part: true },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      <dl className="grid grid-cols-4 gap-x-2 gap-y-1.5 font-display text-meta tabular-nums">
        {cells.map((c) => (
          <div key={c.key} className="flex min-w-0 flex-col">
            <dt
              title={c.key === "kcal" ? undefined : labels[c.key]}
              className="inline-flex min-w-0 items-center gap-0.5 text-muted"
            >
              <NutrientIcon name={c.key} size={c.part ? 12 : 14} />
              <span className="truncate">{short[c.key]}</span>
            </dt>
            <dd className={c.part ? "text-muted" : "font-semibold"}>{c.value}</dd>
          </div>
        ))}
      </dl>
      {values.split && <MacroBar split={values.split} label={labels.split} />}
    </div>
  );
}
