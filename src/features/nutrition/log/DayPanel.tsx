/**
 * features/nutrition/log/DayPanel.tsx — the day's totals against its targets,
 * in ONE panel (replaces the separate ring and label, which repeated each
 * other):
 *   - left: concentric rings — energy outside, then protein, carbs, fat,
 *     fibre — with what's left (or how much over) of energy in the middle;
 *   - right: one bar per nutrient, all eight, "value / target", a short
 *     status line and an "auto" marker for recommended default targets;
 *   - bottom: the day's cost.
 *
 * Meaning comes from core (core/nutrition/targets.ts: kinds min/max/target,
 * assessTarget, auto targets); colour grading from ui/targetTone.ts. Server
 * component: renders once, no JavaScript sent.
 */
import { Coins, PieChart } from "lucide-react";

import { macroSplit } from "@/core/nutrition/insights";
import {
  NUTRIENT_KEYS,
  NUTRIENT_UNIT,
  type NutrientKey,
} from "@/core/nutrition/nutrients";
import { zoneOf, type Bands } from "@/core/nutrition/bands";
import { assessTarget, TARGET_KIND, type Targets } from "@/core/nutrition/targets";
import type { DisplayTotals } from "@/core/nutrition/totals";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ConcentricRings } from "@/ui/ConcentricRings";
import { MacroBar } from "@/ui/MacroBar";
import { NutrientIcon, NUTRIENT_VAR } from "@/ui/NutrientIcon";
import { BandBar } from "@/ui/BandBar";
import { TargetBar } from "@/ui/TargetBar";
import { targetTone } from "@/ui/targetTone";

/** The same heading as every ui/Section. */
const PANEL_HEADING = "section-heading";

type Props = {
  totals: DisplayTotals;
  /** Eaten + planned (ADR-0009): shown translucent behind what was eaten. */
  withPlanned: DisplayTotals;
  /** Targets including auto defaults (core withAutoTargets). */
  targets: Targets;
  /** ADR-0023: floor / good zone / ceiling per macro, when the weight is known. */
  bands?: Bands;
  auto: NutrientKey[];
  locale: Locale;
  t: Pick<Messages, "label" | "nutrients" | "macro" | "panel" | "day">;
};

/** Each nutrient's own colour token (bars and rings start from it). */
const SUB: ReadonlySet<NutrientKey> = new Set(["sugars", "saturatedFat"]);
const RINGS = ["kcal", "protein", "carbs", "fat", "fiber"] as const;

export function DayPanel({
  totals,
  withPlanned,
  targets,
  bands,
  auto,
  locale,
  t,
}: Props) {
  const num = (v: string, k: NutrientKey) =>
    formatNumber(v, locale, k === "salt" ? 1 : 0);
  const assess = (k: NutrientKey) =>
    assessTarget(totals.nutrients[k], targets[k], TARGET_KIND[k]);
  /** Where the day ends if the plan is followed, as a ratio of the target. */
  const plannedRatio = (k: NutrientKey) => {
    const a = assessTarget(withPlanned.nutrients[k], targets[k], TARGET_KIND[k]);
    return a.status === "none" ? undefined : a.ratio;
  };
  const plannedKcal = Number(withPlanned.nutrients.kcal) - Number(totals.nutrients.kcal);
  const tone = (k: NutrientKey) => {
    const a = assess(k);
    return targetTone({
      kind: TARGET_KIND[k],
      status: a.status,
      ratio: a.status === "none" ? 0 : a.ratio,
      base: NUTRIENT_VAR[k]!,
    });
  };

  /** With a band: which zone, and the good zone's range. */
  const zoneText = (k: NutrientKey, v: string): string | undefined => {
    const b = bands?.[k];
    if (!b) return undefined;
    const u = NUTRIENT_UNIT[k];
    return fill(t.panel.zones[zoneOf(Number(v), b)], {
      low: num(String(b.low), k),
      high: num(String(b.high), k),
      floor: num(String(b.floor), k),
      ceiling: num(String(b.ceiling), k),
      u,
    });
  };

  /** The short line under a bar, worded for the target's kind. */
  const statusText = (k: NutrientKey, a = assess(k)): string | undefined => {
    if (a.status === "none") return undefined;
    const v = `${num(a.delta, k)} ${NUTRIENT_UNIT[k]}`;
    const kind = TARGET_KIND[k];
    if (kind === "max")
      return fill(a.status === "over" ? t.panel.overLimit : t.panel.underLimit, { v });
    if (a.status === "under") return fill(t.label.remaining, { v });
    if (kind === "target" && a.status === "on") return t.panel.onTarget;
    return fill(t.label.over, { v }); // over a target, or above a minimum (fine)
  };

  /** "value / target unit" (or just "value unit" without a target). */
  const valueText = (v: string, k: NutrientKey) =>
    targets[k] === null
      ? `${num(v, k)} ${NUTRIENT_UNIT[k]}`
      : `${num(v, k)} / ${num(targets[k]!, k)} ${NUTRIENT_UNIT[k]}`;

  /** Where the plan leads, in numbers; nothing when it changes nothing here. */
  const plannedText = (k: NutrientKey): string | undefined => {
    const v = withPlanned.nutrients[k];
    if (num(v, k) === num(totals.nutrients[k], k)) return undefined;
    const status = statusText(k, assessTarget(v, targets[k], TARGET_KIND[k]));
    return [fill(t.day.withPlanned, { v: valueText(v, k) }), status]
      .filter(Boolean)
      .join(" · ");
  };

  /** One nutrient: against its band (ui/BandBar), else its target (ui/TargetBar). */
  const bar = (k: NutrientKey) => {
    const a = assess(k);
    const { color, opacity } = tone(k);
    const value = valueText(totals.nutrients[k], k);
    const b = bands?.[k];
    if (b) {
      const g = (v: number) => `${num(String(v), k)} ${NUTRIENT_UNIT[k]}`;
      return (
        <BandBar
          key={k}
          icon={<NutrientIcon name={k} />}
          label={t.nutrients[k]}
          value={value}
          status={[zoneText(k, totals.nutrients[k]), statusText(k)]
            .filter(Boolean)
            .join(" · ")}
          planned={plannedText(k)}
          eaten={Number(totals.nutrients[k])}
          withPlan={Number(withPlanned.nutrients[k])}
          target={targets[k] === null ? null : Number(targets[k])}
          band={b}
          color={`var(${NUTRIENT_VAR[k]})`}
          legend={{
            floor: fill(t.panel.bandFloor, { v: g(b.floor) }),
            good: fill(t.panel.bandGood, { low: num(String(b.low), k), high: g(b.high) }),
            ceiling: fill(
              b.ceilingKind === "health"
                ? t.panel.bandCeilingHealth
                : t.panel.bandCeilingUseful,
              { v: g(b.ceiling) },
            ),
          }}
          autoLabel={auto.includes(k) ? t.panel.auto : undefined}
          autoHint={auto.includes(k) ? t.panel.autoHint : undefined}
        />
      );
    }
    return (
      <TargetBar
        key={k}
        icon={SUB.has(k) ? null : <NutrientIcon name={k} />}
        label={t.nutrients[k]}
        sub={SUB.has(k)}
        value={value}
        status={statusText(k)}
        ratio={a.status === "none" ? null : a.ratio}
        plannedRatio={plannedRatio(k)}
        planned={plannedText(k)}
        color={color}
        opacity={opacity}
        autoLabel={auto.includes(k) ? t.panel.auto : undefined}
        autoHint={auto.includes(k) ? t.panel.autoHint : undefined}
      />
    );
  };

  const kcal = assess("kcal");
  const split = macroSplit(totals.nutrients);
  const unit = NUTRIENT_UNIT.kcal;
  /** Where the energy comes from: the bar and its words. */
  const splitLine = split && (
    <div className="w-full">
      <MacroBar split={split} label={t.macro.splitTitle} />
      <p className="pt-1 text-center font-display text-meta text-muted tabular-nums">
        {[
          `${t.macro.protein} ${split.protein}%`,
          `${t.macro.carbs} ${split.carbs}% (${fill(t.macro.sugarsOf, { v: String(split.sugars) })})`,
          `${t.macro.fat} ${split.fat}% (${fill(t.macro.saturatedOf, { v: String(split.saturatedFat) })})`,
          fill(t.macro.fiberOf, { v: String(split.fiber) }),
        ].join(" · ")}
      </p>
    </div>
  );
  const cost = (
    <p className="flex items-center justify-between gap-2 rule-t-medium border-ink pt-2 text-meta">
      <span className="flex items-center gap-1.5 font-semibold">
        <Coins size={16} aria-hidden="true" />
        {t.label.cost}
      </span>
      <span className="flex flex-col items-end text-right">
        <span className="font-display text-item tabular-nums">
          {totals.costComplete
            ? formatCents(totals.costCents, locale)
            : fill(t.label.costPartialShort, {
                v: formatCents(totals.costCents, locale),
              })}
        </span>
        {/* The reason on its own small line: the amount stays one line. */}
        {!totals.costComplete && (
          <span className="text-muted">{t.label.costMissing}</span>
        )}
        {withPlanned.costCents !== totals.costCents && (
          <span className="text-muted italic tabular-nums">
            {fill(t.label.costWithPlanned, {
              v: withPlanned.costComplete
                ? formatCents(withPlanned.costCents, locale)
                : fill(t.label.costPartialShort, {
                    v: formatCents(withPlanned.costCents, locale),
                  }),
            })}
          </span>
        )}
      </span>
    </p>
  );

  const heading = (
    <h2 id="day-panel-title" className={PANEL_HEADING}>
      <span className="section-icon">
        <PieChart size={20} aria-hidden="true" />
      </span>
      {t.label.title}
    </h2>
  );

  return (
    <section
      aria-labelledby="day-panel-title"
      className="@container panel flex flex-col gap-4 p-4"
    >
      {heading}
      <div className="flex flex-col items-center gap-6 @2xl:flex-row @2xl:items-start">
        <div className="flex flex-col items-center gap-2">
          <ConcentricRings
            size={220}
            label={t.label.title}
            rings={RINGS.map((k) => {
              const a = assess(k);
              const { color, opacity } = tone(k);
              return {
                key: k,
                ratio: a.status === "none" ? 0 : a.ratio,
                plannedRatio: plannedRatio(k),
                color,
                opacity,
                label: `${t.nutrients[k]}: ${num(totals.nutrients[k], k)} ${NUTRIENT_UNIT[k]}`,
              };
            })}
          >
            <span className="font-display text-title font-extrabold tabular-nums">
              {num(kcal.status === "none" ? totals.nutrients.kcal : kcal.delta, "kcal")}
            </span>
            <span className="text-meta text-muted">
              {kcal.status === "none"
                ? `${unit}`
                : `${unit} ${kcal.status === "under" ? t.panel.left : kcal.status === "over" ? t.panel.over : t.panel.off}`}
            </span>
          </ConcentricRings>
          {/* Below, not inside: the centre only fits the main number. */}
          {plannedKcal > 0 && (
            <span className="text-meta text-muted tabular-nums">
              {fill(t.day.plannedNote, {
                v: formatNumber(String(plannedKcal), locale, 0),
              })}
            </span>
          )}
          {/* Legend: ring order, outside -> inside. */}
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-meta text-muted">
            {RINGS.map((k) => (
              <li key={k} className="inline-flex items-center gap-1">
                <NutrientIcon name={k} size={12} />
                {t.nutrients[k]}
              </li>
            ))}
          </ul>
          {splitLine}
        </div>

        <div className="flex w-full flex-1 flex-col gap-2.5">
          {NUTRIENT_KEYS.map((k) => bar(k))}
        </div>
      </div>
      {cost}
    </section>
  );
}
