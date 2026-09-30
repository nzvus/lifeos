/**
 * features/nutrition/trends/ChartLegend.tsx — what the bar colours mean:
 * the same graded colours as the day panel (ui/targetTone).
 */
import type { Messages } from "@/i18n";

export function ChartLegend({ t }: { t: Messages["trends"] }) {
  const swatch = "inline-block h-2.5 w-2.5";
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-meta text-muted">
      <span className="inline-flex items-center gap-1">
        <span className="inline-flex" aria-hidden="true">
          <span className={`${swatch} bg-kcal opacity-50`} />
          <span className={`${swatch} bg-macro-protein opacity-50`} />
        </span>
        {t.underTarget}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className={`${swatch} bg-herb`} aria-hidden="true" />
        {t.withinTarget}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className={`${swatch} bg-tomato`} aria-hidden="true" />
        {t.overTarget}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-0.5 w-3 bg-ink" aria-hidden="true" />
        {t.targetLine}
      </span>
    </p>
  );
}
