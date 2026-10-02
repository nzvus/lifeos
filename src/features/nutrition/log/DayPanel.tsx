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
import { bandFor, bandState, type Bands } from "@/core/nutrition/bands";
import { assessTarget, TARGET_KIND, type Targets } from "@/core/nutrition/targets";
import type { DisplayTotals } from "@/core/nutrition/totals";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ConcentricRings } from "@/ui/ConcentricRings";
import { MacroBar } from "@/ui/MacroBar";
import { NutrientIcon, NUTRIENT_VAR } from "@/ui/NutrientIcon";
import { NutrientRow, type RowState } from "@/ui/NutrientRow";
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

  /**
   * One nutrient as a simple row (ui/NutrientRow): its zone — the band
   * (ADR-0023/0025) where there is one, else one made from the target's
   * kind — then a single state and a single line of words.
   */
  const bar = (k: NutrientKey) => {
    const v = Number(totals.nutrients[k]);
    const vp = Number(withPlanned.nutrients[k]);
    const target = targets[k] === null ? null : Number(targets[k]);
    const u = NUTRIENT_UNIT[k];
    const g = (n: number) => `${num(String(Math.round(n * 10) / 10), k)} ${u}`;
    const kind = TARGET_KIND[k];
    const real = bands?.[k];
    const band = bandFor(real, target, kind);
    const state: RowState = bandState(v, band);
    const status = !band
      ? undefined
      : state === "short"
        ? fill(t.panel.toGo, { v: g((k === "kcal" && target ? target : band.low) - v) })
        : state === "good"
          ? kind === "max"
            ? fill(t.panel.underLimit, { v: g(band.high - v) })
            : t.panel.inZone
          : state === "high"
            ? band.ceilingKind === "useful" && v > band.ceiling
              ? fill(t.panel.noBenefit, { v: g(band.ceiling) })
              : fill(t.panel.aboveZone, { v: g(band.high) })
            : fill(t.panel.past, { v: g(band.ceiling) });
    const details = (
      <>
        {real && (
          <span>
            {fill(t.panel.bandLine, {
              floor: g(real.floor),
              low: num(String(real.low), k),
              high: g(real.high),
              ceiling: g(real.ceiling),
              kind: real.ceilingKind === "health" ? t.panel.maxHealth : t.panel.maxUseful,
            })}
          </span>
        )}
        {target !== null && <span>{fill(t.panel.targetLine, { v: g(target) })}</span>}
        {vp !== v && <span>{fill(t.panel.planLine, { v: g(vp) })}</span>}
      </>
    );
    return (
      <NutrientRow
        key={k}
        icon={SUB.has(k) ? undefined : <NutrientIcon name={k} />}
        label={t.nutrients[k]}
        sub={SUB.has(k)}
        amount={g(v)}
        status={status}
        state={state}
        eaten={v}
        withPlan={vp}
        zone={
          band && kind !== "max"
            ? { low: band.low, high: band.high }
            : band
              ? { low: 0, high: band.high }
              : null
        }
        max={band ? Math.max(band.ceiling * 1.15, v, vp, target ?? 0) || 1 : 1}
        details={real || target !== null || vp !== v ? details : undefined}
        autoLabel={auto.includes(k) ? t.panel.auto : undefined}
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

        <div className="flex w-full flex-1 flex-col gap-3">
          {NUTRIENT_KEYS.map((k) => bar(k))}
        </div>
      </div>
      {cost}
    </section>
  );
}
