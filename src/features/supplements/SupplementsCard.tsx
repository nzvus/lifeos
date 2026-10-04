/**
 * features/supplements/SupplementsCard.tsx — a day's compounds (ADR-0039):
 * caffeine taken against the day's 400 mg, in the body now and at bedtime;
 * creatine's stores. The same one-line bars as the nutrients
 * (ui/NutrientBar); the model's words behind the ⓘ.
 */
import { BatteryCharging, Coffee } from "lucide-react";
import type { SupplementsDay } from "@/core/supplements/day";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { InfoTip } from "@/ui/InfoTip";
import { NutrientBar } from "@/ui/NutrientBar";
import { Section } from "@/ui/Section";

export function SupplementsCard({
  s,
  locale,
  t,
}: {
  s: SupplementsDay;
  locale: Locale;
  t: Messages["supplements"];
}) {
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const c = s.caffeine;
  const k = s.creatine;
  const pct = Math.round(k.saturation * 100);
  return (
    <Section
      title={t.title}
      icon={<Coffee size={20} aria-hidden="true" />}
      aside={<InfoTip label={t.infoLabel}>{t.info}</InfoTip>}
    >
      <div className="flex flex-col gap-2">
        <NutrientBar
          icon={<Coffee size={14} aria-hidden="true" />}
          label={t.caffeine}
          amount={`${n(c.dayMg)} / ${n(c.limitMg)} mg`}
          status={fill(t.caffeineWords, { day: n(c.dayMg), now: n(c.nowMg) })}
          state={c.dayMg === 0 ? "none" : c.dayMg > c.limitMg ? "over" : "good"}
          eaten={c.dayMg}
          withPlan={c.dayMg}
          zone={null}
          limit={c.limitMg}
          max={Math.max(c.limitMg * 1.15, c.dayMg)}
        />
        <p className="flex flex-wrap gap-x-3 pl-1 text-meta text-muted tabular-nums">
          <span>{fill(t.now, { v: n(c.nowMg) })}</span>
          {c.bedMg !== null && (
            <span className={c.bedMg > 50 ? "font-semibold text-warn" : ""}>
              {fill(c.bedMg > 50 ? t.bedHigh : t.bed, { v: n(c.bedMg) })}
            </span>
          )}
        </p>
        <NutrientBar
          icon={<BatteryCharging size={14} aria-hidden="true" />}
          label={t.creatine}
          amount={`${pct} %`}
          status={fill(t.creatineWords, {
            pct: String(pct),
            g: n(k.dayG, 1),
            days: String(k.daysTaken30),
          })}
          state={k.saturation >= 0.9 ? "good" : k.saturation > 0 ? "short" : "none"}
          eaten={pct}
          withPlan={pct}
          zone={{ low: 90, high: 100 }}
          limit={null}
          max={100}
        />
        <p className="pl-1 text-meta text-muted tabular-nums">
          {fill(t.creatineLine, { g: n(k.dayG, 1), days: String(k.daysTaken30) })}
        </p>
      </div>
    </Section>
  );
}
