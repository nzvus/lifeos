/**
 * features/training/body/WeightSection.tsx — body weight (ADR-0005/0027)
 * in Progress → Weight: the chart (dots and trend, changes over 7 and 30
 * days), then the readings (indices, each weigh-in explained). Adding a
 * weigh-in is the day's "+" (2026-10-02: no add forms on Progress).
 */
import { Scale } from "lucide-react";
import type { WeighInView } from "@/core/energy/repositories/energy";
import type { Locale } from "@/core/shared/locales";
import type { Measurement } from "@/core/training/repositories/measurements";
import type { Messages } from "@/i18n";
import { Section } from "@/ui/Section";
import { WeightChart } from "./WeightChart";
import { WeighInList } from "./WeighInList";

type Outcome = { ok: boolean; message?: string };

export function WeightSection({
  measurements,
  readings,
  locale,
  trash,
  restore,
  t,
}: {
  measurements: Measurement[];
  readings: WeighInView[];
  locale: Locale;
  trash: (id: string) => Promise<Outcome>;
  restore: (id: string) => Promise<Outcome>;
  t: Pick<Messages, "body" | "actions" | "weightChart">;
}) {
  return (
    <Section title={t.body.title} icon={<Scale size={20} aria-hidden="true" />}>
      <WeightChart readings={readings} locale={locale} t={t} />
      {measurements.length === 0 ? (
        <p className="text-meta text-muted">{t.body.none}</p>
      ) : (
        <WeighInList
          measurements={measurements}
          readings={readings}
          locale={locale}
          trash={trash}
          restore={restore}
          t={{ body: t.body, actions: t.actions }}
        />
      )}
    </Section>
  );
}
