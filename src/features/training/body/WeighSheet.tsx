/**
 * features/training/body/WeighSheet.tsx — a weigh-in from the day's "+"
 * (#day-weigh, 2026-10-02); the trend stays in Body → Progress. Split out
 * of the day page (800-line limit).
 */
import { Scale } from "lucide-react";
import Link from "next/link";
import type { FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { TEXT_LINK } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { MeasurementForm } from "./MeasurementForm";

export function WeighSheet({
  action,
  day,
  now,
  count,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  day: string;
  now: string;
  count: number;
  t: Pick<Messages, "body" | "errors" | "actions">;
}) {
  return (
    <Sheet
      id="day-weigh"
      title={t.body.title}
      icon={<Scale size={20} aria-hidden="true" />}
      closeLabel={t.actions.close}
    >
      <MeasurementForm
        action={action}
        today={day}
        now={now}
        count={count}
        t={{ body: t.body, errors: t.errors }}
      />
      <Link href="/profiles?view=weight" className={`text-meta ${TEXT_LINK}`}>
        {t.body.seeTrend}
      </Link>
    </Sheet>
  );
}
