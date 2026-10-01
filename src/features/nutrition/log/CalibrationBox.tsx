/**
 * features/nutrition/log/CalibrationBox.tsx — does the energy model fit you?
 * (ADR-0020). What the scale and the log say over the last 28 days, the
 * model's estimate for the same days, and — when the data is good enough —
 * a proposed factor on the everyday baseline, applied only on Accept.
 * Client component (the buttons).
 */
"use client";

import { Check, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Calibration } from "@/core/energy/calibration";
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
        <p>{fill(t.fewLogged, { n: String(c.loggedDays), of: String(c.days) })}</p>
      )}
      {c.verdict === "ok" && (
        <>
          <ul className="flex flex-col gap-1">
            {[
              [t.intake, `${n(c.intake!)} kcal`],
              [
                t.trend,
                fill(t.trendValue, {
                  kg: `${c.trendKgPerWeek! > 0 ? "+" : ""}${n(c.trendKgPerWeek!, 2)}`,
                }),
              ],
              [t.observed, `${n(c.observed!)} kcal`],
              [t.estimated, `${n(c.estimated!)} kcal`],
            ].map(([label, value]) => (
              <li key={label} className="flex items-baseline justify-between gap-3">
                <span className="text-muted">{label}</span>
                <span className="font-display whitespace-nowrap tabular-nums">
                  {value}
                </span>
              </li>
            ))}
          </ul>
          <p className="font-semibold">
            {c.proposed === null
              ? fill(t.fits, { now: factor(c.current) })
              : fill(t.proposal, { factor: factor(c.proposed), now: factor(c.current) })}
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
