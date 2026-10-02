/**
 * features/training/body/WeightSection.tsx — body weight (ADR-0005/0027):
 * the weigh-in form, then the readings (trend, indices, each weigh-in
 * explained). Lives in Progress → Weight (design review S5): weight is
 * progress, not a training detail.
 */
import { Scale } from "lucide-react";
import type { WeighInView } from "@/core/energy/repositories/energy";
import type { FormState } from "@/core/shared/result";
import type { Locale } from "@/core/shared/locales";
import type { Measurement } from "@/core/training/repositories/measurements";
import type { Messages } from "@/i18n";
import { Section } from "@/ui/Section";
import { MeasurementForm } from "./MeasurementForm";
import { WeighInList } from "./WeighInList";

type Outcome = { ok: boolean; message?: string };

export function WeightSection({
  measurements,
  readings,
  today,
  now,
  locale,
  add,
  trash,
  restore,
  t,
}: {
  measurements: Measurement[];
  readings: WeighInView[];
  today: string;
  now: string;
  locale: Locale;
  add: (prev: FormState, formData: FormData) => Promise<FormState>;
  trash: (id: string) => Promise<Outcome>;
  restore: (id: string) => Promise<Outcome>;
  t: Pick<Messages, "body" | "errors" | "actions">;
}) {
  return (
    <Section title={t.body.title} icon={<Scale size={20} aria-hidden="true" />}>
      <p className="text-meta text-muted">{t.body.hint}</p>
      <MeasurementForm
        action={add}
        today={today}
        now={now}
        count={measurements.length}
        t={{ body: t.body, errors: t.errors }}
      />
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
