/**
 * ui/MacroPreview.tsx — a small box showing what something WOULD be, while
 * the user is still typing: the add-to-day entry, an ingredient's label, a
 * meal's serving (rule of three). A title, then the macro strip, or a hint
 * when there is nothing to show yet. With `short` names, every nutrient in
 * a compact grid (ui/MacroGrid) instead of the strip. Presentation only: the values come
 * from core/nutrition/preview.ts + display.ts.
 */
import type { ReactNode } from "react";
import { MacroGrid, type MacroShortLabels } from "./MacroGrid";
import { MacroStrip, type MacroStripLabels, type MacroStripValues } from "./MacroStrip";

export function MacroPreview({
  title,
  values,
  empty,
  labels,
  children,
}: {
  title: string;
  values: MacroStripValues | null;
  /** Shown while `values` is null. */
  empty: string;
  labels: MacroStripLabels & { short?: MacroShortLabels };
  /** Extra content under the strip (e.g. the effect on meals). */
  children?: ReactNode;
}) {
  return (
    <div className="tile flex flex-col gap-1 p-3">
      <p className="text-meta font-semibold text-muted">{title}</p>
      {values === null ? (
        <p className="text-meta text-muted">{empty}</p>
      ) : labels.short ? (
        <MacroGrid values={values} labels={labels} short={labels.short} />
      ) : (
        <MacroStrip values={values} labels={labels} />
      )}
      {children}
    </div>
  );
}
