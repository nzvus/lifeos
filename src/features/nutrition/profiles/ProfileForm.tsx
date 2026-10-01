/**
 * features/nutrition/profiles/ProfileForm.tsx — create or edit a day type
 * (ADR-0008): a name and optional daily targets, one field per nutrient.
 *
 * ADR-0015: the pinned ui/ActionBar (↺ / Cancel / Save), a draft kept in
 * this browser, Save back to `from` with Undo (ui/useEditFlow); the page
 * header holds the "⋯" menu (make default, delete). The fields start from
 * text values and are remounted by ↺ or a restored draft.
 */
"use client";

import { FileText, Target } from "lucide-react";
import { NUTRIENT_KEYS, NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { DraftNotice } from "@/ui/DraftNotice";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { Section } from "@/ui/Section";
import { toFormData, useEditableForm } from "@/ui/useEditableForm";
import { useEditFlow } from "@/ui/useEditFlow";

type T = Pick<Messages, "profiles" | "nutrients" | "errors" | "actions">;

type Props = {
  /** The day type being edited; absent for a new one. */
  id?: string;
  /** Where Cancel and "after saving" lead. */
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  t: T;
};

export function ProfileForm({ id, from, action, initial, t }: Props) {
  const a = t.actions;
  const { form, base, version, values, saved, dirty, draft, offer, load } =
    useEditableForm(`profile:${id ?? "new"}`, initial);
  const { state, formAction } = useEditFlow({
    id,
    from,
    idle: IDLE,
    action,
    previous: () => toFormData(saved ?? {}),
    name: () => values?.name?.trim() || initial.name || "",
    done: draft.clear,
    labels: a,
  });
  return (
    <form ref={form} action={formAction} className="flex flex-col gap-6">
      {offer && (
        <DraftNotice
          onRestore={() => {
            load(offer);
            draft.clear();
          }}
          onDiscard={draft.clear}
          labels={a}
        />
      )}
      <ProfileFields key={version} state={state} initial={base} t={t} />
      <ActionBar
        dirty={dirty}
        isNew={!id}
        onRestore={() => load(saved ?? initial)}
        cancelHref={from}
        labels={{ save: a.save, cancel: a.cancel, restore: a.restore, saving: a.saving }}
      />
    </form>
  );
}

function ProfileFields({
  state,
  initial,
  t,
}: {
  state: FormState;
  initial: Record<string, string>;
  t: T;
}) {
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");
  return (
    <>
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Section
        as="fieldset"
        title={t.actions.general}
        icon={<FileText size={20} aria-hidden="true" />}
      >
        <Field
          label={t.profiles.name}
          name="name"
          defaultValue={val("name")}
          error={err("name")}
          required
        />
      </Section>
      <Section
        as="fieldset"
        title={t.profiles.targets}
        icon={<Target size={20} aria-hidden="true" />}
      >
        <p className="text-meta text-muted">{t.profiles.targetsHint}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {NUTRIENT_KEYS.map((k) => (
            <Field
              key={k}
              label={`${t.nutrients[k]} (${NUTRIENT_UNIT[k]})`}
              name={k}
              inputMode="decimal"
              defaultValue={val(k)}
              error={err(k)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
