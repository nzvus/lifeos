/**
 * features/nutrition/pantry/ProductForm.tsx — create or edit a product
 * (ADR-0017): what it is, how it is counted (g, ml or pieces), how much one
 * package holds, and, for food, the ingredient it is.
 *
 * ADR-0015 like every editor: the pinned ui/ActionBar (↺ / Cancel / Save), a
 * draft in this browser, Save back to `from` with Undo (ui/useEditFlow).
 */
"use client";

import { FileText } from "lucide-react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { DraftNotice } from "@/ui/DraftNotice";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { Section } from "@/ui/Section";
import { SelectField } from "@/ui/SelectField";
import { toFormData, useEditableForm } from "@/ui/useEditableForm";
import { useEditFlow } from "@/ui/useEditFlow";

type T = Pick<Messages, "pantry" | "errors" | "actions">;
const UNITS = ["g", "ml", "piece"] as const;

type Props = {
  id?: string;
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  /** My ingredients, for the food link. */
  ingredients: { id: string; name: string; unit: string }[];
  t: T;
};

export function ProductForm({ id, from, action, initial, ingredients, t }: Props) {
  const a = t.actions;
  const { form, base, version, values, saved, dirty, draft, offer, load } =
    useEditableForm(`product:${id ?? "new"}`, initial);
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
      <Fields
        key={version}
        state={state}
        initial={base}
        ingredients={ingredients}
        t={t}
      />
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

function Fields({
  state,
  initial,
  ingredients,
  t,
}: {
  state: FormState;
  initial: Record<string, string>;
  ingredients: Props["ingredients"];
  t: T;
}) {
  const p = t.pantry;
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");
  return (
    <Section
      as="fieldset"
      title={t.actions.general}
      icon={<FileText size={20} aria-hidden="true" />}
    >
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Field
        label={p.name}
        name="name"
        defaultValue={val("name")}
        error={err("name")}
        required
      />
      <div className="grid gap-4 @lg:grid-cols-2">
        <Field
          label={p.brand}
          name="brand"
          defaultValue={val("brand")}
          error={err("brand")}
        />
        <Field
          label={p.shop}
          name="shop"
          defaultValue={val("shop")}
          error={err("shop")}
        />
        <SelectField
          label={p.unit}
          name="unit"
          defaultValue={val("unit") || "g"}
          options={UNITS.map((u) => ({ value: u, label: p.units[u] }))}
          error={err("unit")}
        />
        <Field
          label={p.packageSize}
          name="packageSize"
          inputMode="decimal"
          defaultValue={val("packageSize")}
          error={err("packageSize")}
          required
        />
      </div>
      <SelectField
        label={p.ingredient}
        name="ingredientId"
        defaultValue={val("ingredientId")}
        options={[
          { value: "", label: p.ingredientNone },
          ...ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` })),
        ]}
        error={err("ingredientId")}
      />
      <p className="-mt-2 text-meta text-muted">{p.ingredientHint}</p>
      <Field
        label={p.notes}
        name="notes"
        defaultValue={val("notes")}
        error={err("notes")}
      />
    </Section>
  );
}
