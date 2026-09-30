/**
 * features/nutrition/log/DayGlance.tsx — the day "at a glance": a ring for
 * energy (eaten vs target, with what's left in the middle) and one coloured
 * bar per macro plus fibre.
 *
 * Server component, pure display. The comparisons come from
 * core/nutrition/targets.ts (compareToTarget), the colours and icons from
 * ui/NutrientIcon (one colour per nutrient everywhere). The full 8-nutrient
 * label stays below it (NutritionLabel) for the details.
 */
import { NUTRIENT_UNIT, type NutrientKey } from "@/core/nutrition/nutrients";
import { compareToTarget } from "@/core/nutrition/targets";
import type { DisplayTotals } from "@/core/nutrition/totals";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { Meter } from "@/ui/Meter";
import { NUTRIENT_BG, NutrientIcon } from "@/ui/NutrientIcon";
import { Ring } from "@/ui/Ring";

type Props = {
  totals: DisplayTotals;
  targets: Record<NutrientKey, string | null>;
  locale: Locale;
  t: Pick<Messages, "glance" | "nutrients">;
};

const BARS = ["protein", "carbs", "fat", "fiber"] as const;

export function DayGlance({ totals, targets, locale, t }: Props) {
  const whole = (v: string) => formatNumber(v, locale, 0);
  const kcal = compareToTarget(totals.nutrients.kcal, targets.kcal);
  const unit = NUTRIENT_UNIT.kcal;

  return (
    <section
      aria-label={t.nutrients.kcal}
      className="flex flex-col items-center gap-5 border-4 border-ink bg-sheet p-4 sm:flex-row sm:items-center"
    >
      <Ring
        percent={kcal.status === "none" ? 0 : kcal.percent}
        colorClass={kcal.status === "over" ? "stroke-tomato" : "stroke-herb"}
        label={`${t.nutrients.kcal}: ${whole(totals.nutrients.kcal)} ${unit}`}
      >
        {kcal.status === "none" ? (
          <>
            <span className="font-display text-3xl font-extrabold tabular-nums">
              {whole(totals.nutrients.kcal)}
            </span>
            <span className="text-xs text-muted">{`${unit} ${t.glance.eaten}`}</span>
          </>
        ) : (
          <>
            <span
              className={`font-display text-3xl font-extrabold tabular-nums ${kcal.status === "over" ? "text-tomato" : ""}`}
            >
              {whole(kcal.status === "over" ? kcal.over : kcal.remaining)}
            </span>
            <span className="text-xs text-muted">{`${unit} ${kcal.status === "over" ? t.glance.over : t.glance.left}`}</span>
            <span className="pt-1 text-xs text-muted tabular-nums">
              {`${whole(totals.nutrients.kcal)} / ${whole(targets.kcal!)}`}
            </span>
          </>
        )}
      </Ring>

      <div className="flex w-full flex-1 flex-col gap-3">
        {BARS.map((k) => {
          const cmp = compareToTarget(totals.nutrients[k], targets[k]);
          const value =
            targets[k] === null
              ? `${whole(totals.nutrients[k])} ${NUTRIENT_UNIT[k]}`
              : `${whole(totals.nutrients[k])} / ${whole(targets[k]!)} ${NUTRIENT_UNIT[k]}`;
          return (
            <Meter
              key={k}
              icon={<NutrientIcon name={k} />}
              label={t.nutrients[k]}
              value={value}
              percent={cmp.status === "none" ? null : cmp.percent}
              over={cmp.status === "over"}
              colorClass={NUTRIENT_BG[k]!}
            />
          );
        })}
        {kcal.status === "none" && (
          <p className="text-sm text-muted">{t.glance.noTarget}</p>
        )}
        {kcal.status !== "none" && (
          <p className="sr-only">
            {fill(t.glance.target, { v: `${whole(targets.kcal!)} ${unit}` })}
          </p>
        )}
      </div>
    </section>
  );
}
