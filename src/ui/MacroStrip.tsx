/**
 * ui/MacroStrip.tsx — THE way macros are shown everywhere (ingredient rows,
 * meal cards, log entries): one compact line with a coloured square per
 * nutrient and its value, and underneath the thin energy-split bar.
 *
 * The colour is the key: raspberry = protein, amber = carbs, blue = fat,
 * green = fibre (design/theme.css), the same as in the charts, so after a day
 * of use the letters are barely needed. Two lines tall at most, so long
 * lists stay scannable.
 *
 * Presentation only: values arrive formatted, the split arrives computed
 * (core/nutrition/insights.ts macroSplit). `labels` are the short letters
 * for screen readers and the legend (i18n `macro`).
 */
import { MacroBar } from "./MacroBar";

type Props = {
  /** Energy, already formatted with its unit ("372 kcal"), optional. */
  energy?: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  /** Percent of energy from protein/carbs/fat; omit to hide the bar. */
  split?: { protein: number; carbs: number; fat: number } | null;
  labels: { protein: string; carbs: string; fat: string; fiber?: string; split: string };
};

const DOT = "inline-block h-2 w-2 shrink-0";

export function MacroStrip({ energy, protein, carbs, fat, fiber, split, labels }: Props) {
  const items = [
    { key: "p", color: "bg-macro-protein", label: labels.protein, value: protein },
    { key: "c", color: "bg-macro-carbs", label: labels.carbs, value: carbs },
    { key: "f", color: "bg-macro-fat", label: labels.fat, value: fat },
    ...(fiber !== undefined && labels.fiber
      ? [{ key: "fi", color: "bg-macro-fiber", label: labels.fiber, value: fiber }]
      : []),
  ];
  return (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-display text-sm tabular-nums">
        {energy && <span className="font-semibold">{energy}</span>}
        {items.map((i) => (
          <span key={i.key} className="inline-flex items-center gap-1">
            <span className={`${DOT} ${i.color}`} aria-hidden="true" />
            <span className="sr-only">{i.label}</span>
            {i.value}
          </span>
        ))}
      </p>
      {split && <MacroBar {...split} label={labels.split} />}
    </div>
  );
}
