/**
 * features/nutrition/log/DayProfilePicker.tsx — "what kind of day is this?"
 * on the day page (ADR-0008).
 *
 * Shows where the day's targets come from (fixed / default / none) and lets
 * the user pick a day type, which copies its targets onto the day as soon
 * as the select changes (no separate "Apply" button). The
 * explanation texts matter: the difference between "default" (follows the
 * profile, still changeable) and "fixed" (a frozen copy) must be visible.
 */
"use client";

import { useActionState } from "react";
import type { DayTargets } from "@/core/nutrition/repositories/profiles";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";

type Props = {
  day: string;
  current: DayTargets;
  profiles: { id: string; name: string }[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  t: Pick<Messages, "day" | "errors">;
};

export function DayProfilePicker({ day, current, profiles, action, t }: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE);
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
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="day" value={day} />
      {fieldError(state, "profileId", t.errors) && (
        <FormAlert tone="error">{fieldError(state, "profileId", t.errors)!}</FormAlert>
      )}
      {/* Applies as soon as it changes: one tap instead of two. */}
      <SelectField
        label={t.day.profileLabel}
        name="profileId"
        id="day-profile"
        defaultValue={selected}
        options={profiles.map((p) => ({ value: p.id, label: p.name }))}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        disabled={pending}
      />
      <p className="text-meta text-muted">{status}</p>
    </form>
  );
}
