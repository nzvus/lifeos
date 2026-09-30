/**
 * ui/MacroBar.tsx — a thin bar of where the energy comes from, in percent:
 *
 *   protein | carbs [sugars solid, the rest lighter] | fat [saturated solid,
 *   the rest lighter] | fibre
 *
 * One glance says "mostly protein", "carbs, but little sugar", "fat, mostly
 * saturated". Presentation only: the percentages come from
 * core/nutrition/insights.ts macroSplit. Colours are the --color-macro-*
 * tokens; "lighter" is the same colour at reduced opacity, so every theme
 * and dark mode work without new tokens.
 */
export type MacroBarSplit = {
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  /** Part of `carbs`. */
  sugars?: number;
  /** Part of `fat`. */
  saturatedFat?: number;
};

const LIGHT = "opacity-45";

export function MacroBar({ split, label }: { split: MacroBarSplit; label: string }) {
  const { protein, carbs, fat, fiber = 0, sugars = 0, saturatedFat = 0 } = split;
  const segments = [
    { key: "p", className: "bg-macro-protein", width: protein },
    { key: "su", className: "bg-macro-carbs", width: sugars },
    { key: "c", className: `bg-macro-carbs ${LIGHT}`, width: carbs - sugars },
    { key: "sa", className: "bg-macro-fat", width: saturatedFat },
    { key: "f", className: `bg-macro-fat ${LIGHT}`, width: fat - saturatedFat },
    { key: "fi", className: "bg-macro-fiber", width: fiber },
  ];
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="flex h-1.5 w-full overflow-hidden bg-hairline"
    >
      {segments.map(
        (s) =>
          s.width > 0 && (
            <span key={s.key} className={s.className} style={{ width: `${s.width}%` }} />
          ),
      )}
    </span>
  );
}
