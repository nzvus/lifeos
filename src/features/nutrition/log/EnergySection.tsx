/**
 * features/nutrition/log/EnergySection.tsx — what the day costs and what
 * came in (ADR-0014): every part of the expenditure as a range, the total
 * so far and with the plan, the intake eaten and with the planned food, and
 * the balance. Without body data it says what is missing, never a guess.
 * The day's movement (level, walking, steps) is edited here, and on today's
 * page the calibration against the scale (ADR-0020) is proposed.
 * Server component; the movement form is a client island.
 */
import { Flame } from "lucide-react";
import Link from "next/link";
import type { Calibration } from "@/core/energy/calibration";
import type { Energy, MissingBody, Range } from "@/core/energy/energy";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { TEXT_LINK } from "@/ui/button";
import { Disclosure } from "@/ui/Disclosure";
import { Section } from "@/ui/Section";
import { ActivityForm } from "./ActivityForm";
import { CalibrationBox } from "./CalibrationBox";
import type { FormState } from "@/core/shared/result";

type Props = {
  energy: Energy | null;
  missing: MissingBody;
  activity: { level: string; walkingMin: number | null; steps: number | null };
  /** kcal eaten, and eaten + planned (exact strings). */
  eaten: string;
  withPlanned: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** ADR-0020: the accepted factor on the baseline (1 = none). */
  correction: number;
  /** ADR-0020: the last 28 days against the model (today's page only). */
  calibration: Calibration | null;
  setCorrection: (factor: number) => Promise<{ ok: boolean; message?: string }>;
  locale: Locale;
  t: Pick<Messages, "energy" | "errors">;
};

export function EnergySection({
  energy,
  missing,
  activity,
  eaten,
  withPlanned,
  action,
  correction,
  calibration,
  setCorrection,
  locale,
  t,
}: Props) {
  const e = t.energy;
  const n = (v: number) => formatNumber(String(v), locale, 0);
  const range = (x: Range) =>
    x.low === x.high ? `${n(x.low)} kcal` : `${n(x.low)}–${n(x.high)} kcal`;
  const balance = (intake: string, out: Range) => {
    const kcal = Number(intake);
    const sign = (v: number) => (v > 0 ? `+${n(v)}` : n(v));
    return fill(e.balanceText, {
      lo: sign(Math.round(kcal - out.high)),
      hi: sign(Math.round(kcal - out.low)),
    });
  };
  const row = (label: string, value: string, strong = false) => (
    <li
      className={`flex items-baseline justify-between gap-3 ${strong ? "font-semibold" : ""}`}
    >
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span className="shrink-0 font-display whitespace-nowrap tabular-nums">
        {value}
      </span>
    </li>
  );
  return (
    <Section
      title={e.title}
      icon={<Flame size={20} aria-hidden="true" />}
      subtitle={e.subtitle}
    >
      {!energy ? (
        <p className="text-meta">
          {fill(e.missing, { list: missing.map((m) => e.missingNames[m]).join(", ") })}{" "}
          <Link href="/settings" className={TEXT_LINK}>
            {e.openSettings}
          </Link>
        </p>
      ) : (
        <div className="grid gap-6 @2xl:grid-cols-2">
          <ul className="flex flex-col gap-1 text-meta">
            {row(e.bmr, `${n(energy.bmr)} kcal`)}
            {row(
              correction === 1
                ? e.baseline
                : fill(e.baselineCorrected, {
                    factor: formatNumber(String(correction), locale, 2),
                  }),
              range(energy.baseline),
            )}
            {row(e.walking, range(energy.walking))}
            {row(e.trainingDone, range(energy.training.done))}
            {row(e.trainingPlanned, range(energy.training.planned))}
            {row(e.digestion, range(energy.digestion.withPlan))}
            {row(e.totalDone, range(energy.total.done), true)}
            {row(e.totalPlan, range(energy.total.withPlan), true)}
          </ul>
          <ul className="flex flex-col gap-1 text-meta">
            {row(e.eaten, `${n(Number(eaten))} kcal`)}
            {row(e.balance, balance(eaten, energy.total.done), true)}
            {row(e.withPlanned, `${n(Number(withPlanned))} kcal`)}
            {row(e.balance, balance(withPlanned, energy.total.withPlan), true)}
          </ul>
        </div>
      )}
      <Disclosure summary={e.activity}>
        <ActivityForm action={action} initial={activity} t={t} />
      </Disclosure>
      {calibration && calibration.verdict !== "no_body" && (
        <Disclosure
          summary={e.calibration.title}
          // Open by itself only when there is something to decide.
          defaultOpen={calibration.proposed !== null}
        >
          <CalibrationBox
            c={calibration}
            accept={setCorrection}
            locale={locale}
            t={e.calibration}
          />
        </Disclosure>
      )}
    </Section>
  );
}
