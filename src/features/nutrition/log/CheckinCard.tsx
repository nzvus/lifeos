/**
 * features/nutrition/log/CheckinCard.tsx — the weekly check-in on Today
 * (ADR-0043): what you spend (learnt or the model's), the next 7 days'
 * targets, the same each day; Accept fixes them, Skip leaves the days to
 * the goal. Never applied silently. Client component (the buttons).
 */
"use client";

import { CalendarCheck, Check, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { toast } from "@/ui/Toast";

type Outcome = { ok: boolean; message?: string };

export type CheckinView = {
  expenditure: number | null;
  weightKg: number | null;
  /** ADR-0045: the pace planned from the target, when the goal has a kind. */
  plan: { ratePctWeek: number; status: string } | null;
  learnt: boolean;
  previous: number | null;
  proposedFactor: number | null;
  targets: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    floored: boolean;
  } | null;
};

export function CheckinCard({
  c,
  decide,
  locale,
  t,
}: {
  c: CheckinView;
  decide: (decision: "accept" | "skip") => Promise<Outcome>;
  locale: Locale;
  t: Messages["energy"]["weightGoal"];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const run = (decision: "accept" | "skip", done: string) =>
    start(async () => {
      const r = await decide(decision);
      toast({ message: r.ok ? done : (r.message ?? "") });
      router.refresh();
    });

  return (
    <section
      aria-label={t.checkinTitle}
      className="flex flex-col gap-2 rule-t-medium border-hairline pt-3 text-meta"
    >
      <h2 className="flex items-center gap-2 font-display text-item font-semibold">
        <CalendarCheck size={18} aria-hidden="true" />
        {t.checkinTitle}
      </h2>
      {c.expenditure === null || c.targets === null ? (
        <p className="text-muted">{t.checkinMissing}</p>
      ) : (
        <>
          <p className="tabular-nums">
            {fill(t.checkinSpend, { kcal: n(c.expenditure) })}
            {c.previous !== null && ` ${fill(t.checkinWas, { kcal: n(c.previous) })}`}
          </p>
          <p className="text-muted">{c.learnt ? t.checkinLearnt : t.checkinModel}</p>
          <p className="font-semibold tabular-nums">
            {fill(t.checkinTarget, { kcal: n(c.targets.kcal) })}
          </p>
          <p className="tabular-nums">
            {fill(t.checkinMacros, {
              protein: n(c.targets.protein),
              fat: n(c.targets.fat),
              carbs: n(c.targets.carbs),
            })}
          </p>
          {c.plan && c.plan.ratePctWeek !== 0 && c.weightKg !== null && (
            // What the week's kcal really give (the floor may hold them up):
            // 7,700 kcal a kilo, as in core/energy/goal.ts.
            <p className="text-muted tabular-nums">
              {(() => {
                const balance = c.targets.kcal - c.expenditure;
                const kg = (balance * 7) / 7700;
                return fill(t.planRate, {
                  rate: n(Math.abs((kg / c.weightKg) * 100), 2),
                  kg: n(Math.abs(kg), 2),
                  kcal: n(Math.abs(balance)),
                  dir: balance < 0 ? t.planBelow : t.planAbove,
                });
              })()}
            </p>
          )}
          {c.plan?.status === "reached" && <p>{t.planReached}</p>}
          {c.targets.floored && <p className="text-muted">{t.checkinFloored}</p>}
          {c.proposedFactor !== null && (
            <p className="text-muted">
              {fill(t.checkinFactor, { factor: `×${n(c.proposedFactor, 2)}` })}
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {c.targets !== null && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("accept", fill(t.accepted, { kcal: n(c.targets!.kcal) }))}
            className={buttonClass({ variant: "primary", size: "sm" })}
          >
            <Check size={16} aria-hidden="true" />
            {t.accept}
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => run("skip", t.skipped)}
          className={buttonClass({ variant: "quiet", size: "sm" })}
        >
          <SkipForward size={16} aria-hidden="true" />
          {t.skip}
        </button>
      </div>
    </section>
  );
}
