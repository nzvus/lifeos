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
