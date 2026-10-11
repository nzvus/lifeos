/**
 * features/nutrition/log/SlotLine.tsx — what a slot of the day's program
 * asks (ADR-0044): its time, protein eaten against the slot's share, and
 * the hint for the moments around training and sleep. For a slot with no
 * food yet, its targets. Server component.
 */
import type { SlotInfo } from "@/core/nutrition/slots";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

const pad = (n: number) => String(n).padStart(2, "0");
export const slotTime = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

export function SlotLine({
  slot,
  eatenProtein,
  locale,
  t,
}: {
  slot: SlotInfo;
  /** Null for a slot with no food yet. */
  eatenProtein: number | null;
  locale: Locale;
  t: Messages["dayProgram"];
}) {
  const n = (v: number) => formatNumber(String(v), locale, 0);
  const { kcal, protein } = slot.target;
  const parts =
    eatenProtein === null
      ? [
          t.slotNothing,
          kcal !== null && fill(t.slotTarget, { kcal: n(kcal) }),
          protein !== null && fill(t.slotTargetProtein, { protein: n(protein) }),
        ]
      : [
          protein !== null &&
            fill(t.slotProtein, { eaten: n(eatenProtein), target: n(protein) }),
        ];
  const hint = slot.hint;
  return (
    <span className="flex flex-col text-meta text-muted">
      <span className="tabular-nums">
        {[
          // With food in it the row shows the food's time; the slot's is the plan.
          eatenProtein === null
            ? slotTime(slot.at)
            : fill(t.slotPlannedAt, { time: slotTime(slot.at) }),
          ...parts,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
      {hint && (
        <span>
          {hint.kind === "pre_workout"
            ? fill(t.hints.pre_workout, {
                low: n(hint.carbsLow),
                high: n(hint.carbsHigh),
              })
            : fill(t.hints[hint.kind], { protein: n(hint.protein) })}
        </span>
      )}
    </span>
  );
}
