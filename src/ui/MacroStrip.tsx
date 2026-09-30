/**
 * ui/MacroStrip.tsx — THE way macros are shown everywhere (ingredient and
 * meal cards, log entries, details lines, the add-to-day preview): one
 * compact line, each nutrient as its icon and its grams IN ITS COLOUR, and
 * underneath the thin energy-split bar.
 *
 *   🥩 25 g   🌾 30 g 🍬 3   💧 10 g 💧💧 2   🍃 5 g
 *
 * The colour is the key: raspberry = protein, amber = carbs, blue = fat,
 * green = fibre (design/theme.css), the same as in the bar and the charts.
 * Sugars and saturated fat, when given, follow their macro in the same
 * colour, lighter in weight ("of which"). Each value carries its full name
 * for screen readers and as a tooltip.
 *
 * Presentation only: `values` arrive formatted and the split computed
 * (core/nutrition/display.ts stripValues); `labels` come from i18n
 * (macroLabels).
 */
import { MacroBar, type MacroBarSplit } from "./MacroBar";
import { NUTRIENT_TEXT, NutrientIcon } from "./NutrientIcon";

export type MacroStripValues = {
  /** Energy with its unit ("372 kcal"), optional. */
  energy?: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  /** "Of which": shown after carbs and fat when present. */
  sugars?: string;
  saturatedFat?: string;
  /** Percent of energy (core macroSplit); null/absent hides the bar. */
  split?: MacroBarSplit | null;
};
export type MacroStripLabels = {
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugars: string;
  saturatedFat: string;
  split: string;
};

type Key = Exclude<keyof MacroStripLabels, "split">;

function Value({
  name,
  value,
  label,
  part,
}: {
  name: Key;
  value: string;
  label: string;
  part?: boolean;
}) {
  return (
    <span
      title={label}
      className={`inline-flex items-center gap-0.5 ${NUTRIENT_TEXT[name] ?? ""} ${
        part ? "font-normal" : "font-semibold"
      }`}
    >
      <NutrientIcon name={name} size={part ? 12 : 14} />
      <span className="sr-only">{label}</span>
      {part ? value : `${value} g`}
    </span>
  );
}

export function MacroStrip({
  values,
  labels,
  withEnergy = true,
}: {
  values: MacroStripValues;
  labels: MacroStripLabels;
  /** False when the card already shows the energy elsewhere. */
  withEnergy?: boolean;
}) {
  const { energy, protein, carbs, fat, fiber, sugars, saturatedFat, split } = values;
  return (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-display text-meta tabular-nums">
        {withEnergy && energy && <span className="font-semibold">{energy}</span>}
        <Value name="protein" value={protein} label={labels.protein} />
        <span className="inline-flex items-center gap-1.5">
          <Value name="carbs" value={carbs} label={labels.carbs} />
          {sugars !== undefined && (
            <Value name="sugars" value={sugars} label={labels.sugars} part />
          )}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Value name="fat" value={fat} label={labels.fat} />
          {saturatedFat !== undefined && (
            <Value
              name="saturatedFat"
              value={saturatedFat}
              label={labels.saturatedFat}
              part
            />
          )}
        </span>
        {fiber !== undefined && <Value name="fiber" value={fiber} label={labels.fiber} />}
      </p>
      {split && <MacroBar split={split} label={labels.split} />}
    </div>
  );
}
