/**
 * features/nutrition/log/GoalLine.tsx — a dynamic day's goal in plain words
 * (ADR-0014), and the balance three ways (developer's request, 2026-10-02):
 *
 *   wanted     −deficit (the day type's goal)
 *   with plan  eaten + planned food − energy with the plan
 *   so far     eaten − energy spent so far (days that have come)
 *
 * Balance = eaten − spent: negative is a deficit, positive a surplus. Energy
 * figures are midpoints of ranges, hence "≈". The deficit can be changed
 * here (pencil): it changes the day type and refreshes this day.
 */
"use client";

import { Pencil } from "lucide-react";
import { useActionState, useState } from "react";
import { ON_TARGET_KCAL } from "@/core/energy/energy";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { InfoTip } from "@/ui/InfoTip";
import { Field } from "@/ui/Field";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  day: string;
  /** Null when the day's copy lost its type (deleted): no editing then. */
  profileId: string | null;
  title: string;
  deficitKcal: number;
  eatKcal: number;
  spentKcal: number;
  balance: { wanted: number; withPlan: number; soFar: number | null };
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  locale: Locale;
  t: Pick<Messages, "energy" | "actions" | "errors">;
};

export function GoalLine(p: Props) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await p.action(prev, fd);
    if (r.status === "saved") setEditing(false);
    return r;
  }, IDLE);
  const e = p.t.energy;
  const n = (v: number) => formatNumber(String(v), p.locale, 0);
  const signed = (v: number) => (v > 0 ? `+${n(v)}` : v < 0 ? `−${n(-v)}` : "0");
  const d = p.deficitKcal;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-item font-semibold">
          {[
            p.title,
            d === 0
              ? e.goalMaintain
              : fill(d > 0 ? e.goalDeficit : e.goalSurplus, {
                  kcal: String(Math.abs(d)),
                }),
          ].join(" · ")}
        </span>
        <span className="flex items-center">
          {/* How the balance reads, and any cap: on request (ADR-0038). */}
          <InfoTip label={e.balanceInfo}>
            <p>{e.balanceNote}</p>
          </InfoTip>
          {p.profileId && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={e.editGoal}
              title={e.editGoal}
              className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
          )}
        </span>
      </div>
      {editing && p.profileId && (
        <form action={formAction} className="flex flex-wrap items-end gap-2 py-1">
          <input type="hidden" name="day" value={p.day} />
          <input type="hidden" name="profileId" value={p.profileId} />
          <Field
            label={e.deficit}
            name="deficitKcal"
            type="number"
            step={50}
            defaultValue={String(d)}
            error={fieldError(state, "deficitKcal", p.t.errors)}
            className="flex w-40 flex-col gap-1"
          />
          <SubmitButton size="sm">{p.t.actions.save}</SubmitButton>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className={buttonClass({ variant: "quiet", size: "sm" })}
          >
            {p.t.actions.cancel}
          </button>
          <p className="basis-full text-meta text-muted">{e.deficitHint}</p>
        </form>
      )}
      <span className="text-meta tabular-nums">
        {fill(e.goalEat, { kcal: n(p.eatKcal), spent: n(p.spentKcal) })}
      </span>
      {/* What the three tiles measure (2026-10-04: "the numbers don't add up"). */}
      <span className="pt-1 text-meta text-muted">{e.balanceHead}</span>
      {/* Coloured by meaning: the goal in green; the plan green when it
          lands near the goal, amber when not; "so far" neutral, as the day
          is not over. */}
      <dl className="grid grid-cols-3 gap-2 pt-1 text-meta tabular-nums">
        {(
          [
            [e.balanceWanted, p.balance.wanted, "border-l-herb"],
            [
              e.balanceWithPlan,
              p.balance.withPlan,
              Math.abs(p.balance.withPlan - p.balance.wanted) <= ON_TARGET_KCAL
                ? "border-l-herb"
                : "border-l-warn",
            ],
            [e.balanceSoFar, p.balance.soFar, "border-l-muted"],
          ] as const
        ).map(([label, v, tone]) => (
          <div
            key={label}
            className={`tile flex min-w-0 flex-col rule-l-heavy px-2 py-1 ${tone}`}
          >
            <dt className="truncate text-muted">{label}</dt>
            <dd className="font-display text-item font-semibold">
              {v === null
                ? "—"
                : // The wanted balance is exact; the others come from estimates.
                  `${label === e.balanceWanted || v === 0 ? "" : "≈ "}${signed(v)}`}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
