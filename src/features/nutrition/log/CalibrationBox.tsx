/**
 * features/nutrition/log/CalibrationBox.tsx — what you really spend
 * (ADR-0041): learnt from the scale and the log, with how sure it is; the
 * last two weeks' numbers; and — when known well enough — a proposed
 * factor on the everyday baseline, applied only on Accept.
 * Client component (the buttons).
 */
"use client";

import { Check, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CONFIDENT, type Calibration } from "@/core/energy/calibration";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { toast } from "@/ui/Toast";

type Outcome = { ok: boolean; message?: string };

export function CalibrationBox({
  c,
  accept,
  locale,
  t,
}: {
  c: Calibration;
  accept: (factor: number) => Promise<Outcome>;
  locale: Locale;
  t: Messages["energy"]["calibration"];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const factor = (v: number) => `×${n(v, 2)}`;
  const set = (v: number, done: string) =>
    start(async () => {
      const r = await accept(v);
      toast({ message: r.ok ? done : (r.message ?? "") });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3 text-meta">
      <p className="text-muted">{fill(t.how, { days: String(c.days) })}</p>
      {c.verdict === "few_weigh_ins" && (
        <p>{fill(t.fewWeighIns, { n: String(c.weighIns) })}</p>
      )}
      {c.verdict === "few_logged" && (
        <p>
          {fill(t.fewLogged, {
            n: String(c.loggedDays - c.incompleteDays),
            of: String(c.days),
          })}
        </p>
      )}
      {c.verdict === "ok" && (
        <>
          {c.expenditure && (
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">{t.expenditure}</span>
              <span className="font-display whitespace-nowrap tabular-nums">
                {fill(t.expenditureValue, {
                  mid: n(c.expenditure.mid),
                  low: n(c.expenditure.low),
                  high: n(c.expenditure.high),
                })}
              </span>
            </p>
          )}
          <p className="text-muted">
            {fill(t.learnt, {
              weeks: String(c.weeks),
              factor: factor(c.factor),
              sigma: n(c.sigma, 2),
            })}
          </p>
          <ul className="flex flex-col gap-1">
            {(
              [
                c.intake !== null && [t.intake, `${n(c.intake)} kcal`],
                c.trendKgPerWeek !== null && [
                  t.trend,
                  fill(t.trendValue, {
                    kg: `${c.trendKgPerWeek > 0 ? "+" : ""}${n(c.trendKgPerWeek, 2)}`,
                  }),
                ],
                c.observed !== null && [t.observed, `${n(c.observed)} kcal`],
                c.estimated !== null && [t.estimated, `${n(c.estimated)} kcal`],
              ].filter(Boolean) as [string, string][]
            ).map(([label, value]) => (
              <li key={label} className="flex items-baseline justify-between gap-3">
                <span className="text-muted">{label}</span>
                <span className="font-display whitespace-nowrap tabular-nums">
                  {value}
                </span>
              </li>
            ))}
          </ul>
          {c.closedDays > 0 && (
            <p className="text-muted">{fill(t.closed, { n: String(c.closedDays) })}</p>
          )}
          {c.estimatedShare >= 0.05 && (
            <p className="text-muted">
              {fill(t.estimates, { share: n(c.estimatedShare * 100) })}
              {c.estimateFactor &&
                ` ${fill(t.estimateFactor, {
                  k: n(c.estimateFactor.k, 2),
                  sigma: n(c.estimateFactor.sigma, 2),
                })}`}
            </p>
          )}
          {c.incompleteDays > 0 && (
            <p className="text-muted">
              {fill(t.incomplete, { n: String(c.incompleteDays) })}
            </p>
          )}
          <p className="font-semibold">
            {c.proposed !== null
              ? fill(t.proposal, { factor: factor(c.proposed), now: factor(c.current) })
              : c.sigma > CONFIDENT
                ? fill(t.unsure, { sigma: n(c.sigma, 2) })
                : fill(t.fits, { now: factor(c.current) })}
          </p>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {c.proposed !== null && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              set(c.proposed!, fill(t.accepted, { factor: factor(c.proposed!) }))
            }
            className={buttonClass({ variant: "primary", size: "sm" })}
          >
            <Check size={16} aria-hidden="true" />
            {t.accept}
          </button>
        )}
        {c.current !== 1 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => set(1, t.wasReset)}
            className={buttonClass({ variant: "quiet", size: "sm" })}
          >
            <RotateCcw size={16} aria-hidden="true" />
            {fill(t.reset, { now: factor(c.current) })}
          </button>
        )}
      </div>
    </div>
  );
}
