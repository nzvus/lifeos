/**
 * ui/MacroBars.tsx — the macros of a food card, one row each: name, grams,
 * and a bar on a scale shared by the whole card (100 g, or more for a big
 * serving — core/nutrition/display.ts macroBars). Sugars are the solid part
 * of the carbs bar, saturated fat the solid part of the fat bar, the rest
 * lighter, with their grams at the end of the row.
 *
 * Presentation only: rows arrive computed and formatted.
 */
import { NUTRIENT_BG } from "./NutrientIcon";

export type MacroBarsRow = {
  key: string;
  grams: string;
  share: number;
  part?: { key: string; grams: string; share: number };
};

export function MacroBars({
  rows,
  labels,
  unit,
}: {
  rows: readonly MacroBarsRow[];
  /** Names by key: protein, carbs, fat, fiber, sugars, saturatedFat. */
  labels: Record<string, string>;
  unit: string;
}) {
  return (
    <ul className="flex flex-col gap-0.5 text-meta">
      {rows.map((r) => {
        const bg = NUTRIENT_BG[r.key] ?? "bg-ink";
        return (
          <li key={r.key} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-muted">{labels[r.key]}</span>
            <span className="w-16 shrink-0 text-right font-display tabular-nums">{`${r.grams} ${unit}`}</span>
            <span className="flex flex-1 items-center gap-2">
              <span
                className="relative h-1.5 flex-1 overflow-hidden bg-hairline"
                aria-hidden="true"
              >
                <span
                  className={`absolute inset-y-0 left-0 ${bg} ${r.part ? "opacity-45" : ""}`}
                  style={{ width: `${r.share * 100}%` }}
                />
                {r.part && (
                  <span
                    className={`absolute inset-y-0 left-0 ${bg}`}
                    style={{ width: `${r.part.share * 100}%` }}
                  />
                )}
              </span>
              {r.part && (
                <span className="w-20 shrink-0 font-display text-muted tabular-nums">
                  {`${labels[r.part.key]} ${r.part.grams}`}
                </span>
              )}
              {!r.part && <span className="w-20 shrink-0" aria-hidden="true" />}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
