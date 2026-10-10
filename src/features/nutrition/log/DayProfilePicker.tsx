/**
 * features/nutrition/log/DayProfilePicker.tsx — "what kind of day is this?"
 * on the day page (ADR-0008).
 *
 * Shows where the day's targets come from (fixed / default / none) and lets
 * the user pick a day type, which copies its targets onto the day as soon
 * as the select changes (no separate "Apply" button). The
 * explanation texts matter: the difference between "default" (follows the
 * profile, still changeable) and "fixed" (a frozen copy) must be visible.
 *
 * ADR-0046: with a goal, the numbers come from the goal; the type only
 * picks the day's program. Then it is "the day's program", without the
 * fixed / default badge, and not shown at all with a single type.
 */
"use client";

import { Target } from "lucide-react";
import { useActionState } from "react";
import type { DayTargets } from "@/core/nutrition/repositories/profiles";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { FormAlert } from "@/ui/FormAlert";
import { Badge } from "@/ui/Badge";

type Props = {
  day: string;
  current: DayTargets;
  profiles: { id: string; name: string }[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** A goal is in force on the day (ADR-0046). */
  followsGoal?: boolean;
  t: Pick<Messages, "day" | "errors">;
};

export function DayProfilePicker({
  day,
  current,
  profiles,
  action,
  followsGoal = false,
  t,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  if (followsGoal && profiles.length <= 1) return null; // nothing to choose
  if (profiles.length === 0)
    return <p className="text-meta text-muted">{t.day.noProfiles}</p>;

  const status =
    current.source === "fixed"
      ? fill(t.day.profileFixed, { name: current.name })
      : current.source === "default"
        ? fill(t.day.profileDefault, { name: current.name })
        : t.day.noProfiles;
  const selected = current.source === "none" ? "" : (current.profileId ?? "");

  return (
    // The day type as the card's title (2026-10-02): a coloured disc, the
    // name as a large select, a short badge for where it comes from. The
    // long explanation is the badge's tooltip; only "default" keeps a hint,
    // because it changes at the first food.
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="day" value={day} />
      {fieldError(state, "profileId", t.errors) && (
        <FormAlert tone="error">{fieldError(state, "profileId", t.errors)!}</FormAlert>
      )}
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-herb text-sheet">
          <Target size={20} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <label htmlFor="day-profile" className="text-meta text-muted">
            {followsGoal ? t.day.programLabel : t.day.profileLabel}
          </label>
          {/* Applies as soon as it changes: one tap instead of two. Keyed:
              see ui/SelectField. */}
          <select
            key={selected}
            id="day-profile"
            name="profileId"
            defaultValue={selected}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            disabled={pending}
            // A plain select, like every other (developer, 2026-10-02): the
            // theme's sheet and ink, so the open list keeps its contrast.
            className="mt-0.5 w-full min-w-0 rounded-control rule-b-medium border-ink bg-sheet px-2 py-1.5 font-display text-item font-semibold text-ink outline-none focus-visible:border-focus"
          >
            {current.source === "none" && <option value="">—</option>}
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {current.source !== "none" && !followsGoal && (
          <Badge tone={current.source === "fixed" ? "done" : "planned"} title={status}>
            {current.source === "fixed" ? t.day.sourceFixed : t.day.sourceDefault}
          </Badge>
        )}
      </div>
      {current.source !== "fixed" && !followsGoal && (
        <p className="text-meta text-muted">
          {current.source === "default" ? t.day.defaultHint : status}
        </p>
      )}
    </form>
  );
}
