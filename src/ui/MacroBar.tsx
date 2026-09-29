/**
 * ui/MacroBar.tsx — a thin bar split into three shares (protein, carbs, fat
 * percent of energy). One glance says "mostly protein" or "mostly carbs".
 *
 * Promoted to ui/ on its second use (meal cards and the day's label), per
 * ADR-0002's rule of three. Presentation only: it receives three numbers and
 * a label; the percentages are computed by core/nutrition/insights.ts.
 * Colours are the --color-macro-* tokens in design/theme.css.
 */
type Props = { protein: number; carbs: number; fat: number; label: string };

export function MacroBar({ protein, carbs, fat, label }: Props) {
  return (
    <span
      role="img"
      aria-label={label}
      className="flex h-1.5 w-full overflow-hidden bg-hairline"
    >
      <span className="bg-macro-protein" style={{ width: `${protein}%` }} />
      <span className="bg-macro-carbs" style={{ width: `${carbs}%` }} />
      <span className="bg-macro-fat" style={{ width: `${fat}%` }} />
    </span>
  );
}
