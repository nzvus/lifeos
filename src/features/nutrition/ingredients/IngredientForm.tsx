/**
 * features/nutrition/ingredients/IngredientForm.tsx — create or edit an
 * ingredient, laid out like the label you're copying from.
 *
 * Data flow (the pattern every form in the app follows):
 *   1. The page (src/app/(app)/ingredients/...) passes a SERVER ACTION as
 *      `action`: a function that runs on the server when the form is posted.
 *   2. `useActionState(action, IDLE)` wires the form to it and gives back the
 *      action's last result (`state`): idle, or errors + submitted values.
 *   3. The action validates with core (core/nutrition/validation.ts), saves
 *      through the repository, and either redirects (success) or returns
 *      error codes, which `fieldError` translates with `t.errors`.
 * This component never talks to the database and holds no business rules.
 *
 * "use client": it needs browser state (the unit selector changes labels,
 * and a live preview shows the label as typed and, when editing, how every
 * meal using it would change — MealImpact).
 *
 * ADR-0015 edit model (as the meal editor): header with "←" to `from` and a
 * "⋯" menu (Delete to the trash); the pinned ui/ActionBar (↺ / Cancel /
 * Save); a draft kept in this browser; save and delete go back to `from`
 * with Undo (ui/useEditFlow). The fields stay uncontrolled: the form's
 * values are read as text (ui/useFormValues) and compared with the saved
 * ones; ↺ or a restored draft remount the fields with those values.
 */
"use client";

import { ClipboardList, FileText } from "lucide-react";
import { useState } from "react";
import { stripValues } from "@/core/nutrition/display";
import { NUTRIENT_KEYS } from "@/core/nutrition/nutrients";
import {
  estimateValues,
  PREVIEW_KEYS,
  type MealUse,
  type PreviewKey,
} from "@/core/nutrition/preview";
import type { Locale } from "@/core/shared/locales";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, macroLabels, type Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { MacroPreview } from "@/ui/MacroPreview";
import { DeleteButton } from "@/ui/DeleteButton";
import { PageHeader } from "@/ui/PageHeader";
import { SelectField } from "@/ui/SelectField";
import { Section } from "@/ui/Section";
import { DraftNotice } from "@/ui/DraftNotice";
import { useEditFlow } from "@/ui/useEditFlow";
import { toFormData, useEditableForm } from "@/ui/useEditableForm";
import { MealImpact } from "./MealImpact";
import { QualityFields } from "./QualityFields";

/** The tags sent back after an error (the hidden JSON field), or none. */
function parseTags(raw: string): { name: string; icon: string }[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as { name: string; icon: string }[]) : [];
  } catch {
    return [];
  }
}

type Props = {
  /** The ingredient being edited; absent for a new one. */
  id?: string;
  title: string;
  /** Where back, Cancel and "after saving" lead. */
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Trash and restore (ADR-0015); only for an existing ingredient. */
  trash?: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore?: (id: string) => Promise<{ ok: boolean; message?: string }>;
  /** Field values to start from: empty for "new", the stored row for "edit". */
  initial: Record<string, string>;
  /** Shown under the header (the new-ingredient page's barcode box). */
  intro?: React.ReactNode;
  locale: Locale;
  /** Meals using this ingredient (edit page), for the live effect preview. */
  usedIn?: readonly MealUse[];
  /** ADR-0012: this ingredient's free tags, and all mine (suggestions). */
  tags?: { name: string; icon: string }[];
  knownTags: { name: string; icon: string }[];
  t: Pick<
    Messages,
    "ingredients" | "nutrients" | "errors" | "macro" | "quality" | "actions"
  >;
};

/** The five previewed values as typed in the form (strings, maybe invalid). */
const typedValues = (read: (k: PreviewKey) => string) =>
  Object.fromEntries(PREVIEW_KEYS.map((k) => [k, read(k)])) as Record<PreviewKey, string>;

export function IngredientForm({
  id,
  title,
  from,
  action,
  trash,
  restore,
  initial,
  intro,
  locale,
  usedIn = [],
  tags = [],
  knownTags,
  t,
}: Props) {
  const a = t.actions;
  const {
    form,
    base,
    version,
    values,
    saved,
    dirty,
    draft,
    offer,
    load: loadFields,
  } = useEditableForm(`ingredient:${id ?? "new"}`, initial);

  const { state, formAction, onDelete } = useEditFlow({
    id,
    from,
    idle: IDLE,
    action,
    previous: () => toFormData(saved ?? {}),
    name: () => values?.name?.trim() || initial.name || "",
    trash,
    restore,
    done: draft.clear,
    labels: a,
  });
  const [unit, setUnit] = useState(initial.unit || "g");
  const err = (field: string) => fieldError(state, field, t.errors);
  const val = (field: string) => valueOf(state, field, base[field] ?? "");
  // Live preview (core/nutrition/preview.ts): the label as typed, and the
  // label as saved, to show how each meal using it would change.
  const [typed, setTyped] = useState(() => typedValues((k) => val(k)));
  const before = estimateValues(typedValues((k) => initial[k] ?? ""));
  const current = estimateValues(typed);

  /** Start the fields again from `v` (↺: the saved row; or a draft). */
  const load = (v: Record<string, string>) => {
    loadFields(v);
    setUnit(v.unit || "g");
    setTyped(typedValues((k) => v[k] ?? ""));
  };

  return (
    <form
      ref={form}
      action={formAction}
      // Change events bubble: one handler reads the five values after any edit.
      onChange={(e) => {
        const data = new FormData(e.currentTarget);
        setTyped(typedValues((k) => String(data.get(k) ?? "")));
      }}
      className="flex flex-col gap-6"
    >
      <PageHeader
        title={title}
        back={{
          href: from,
          label: from === "/ingredients" ? t.ingredients.back : a.back,
        }}
        menu={
          onDelete ? (
            <DeleteButton
              onConfirm={() => void onDelete()}
              title={fill(a.confirmDelete, {
                name: values?.name?.trim() || initial.name || "",
              })}
              hint={a.confirmDeleteHint}
              labels={a}
            />
          ) : undefined
        }
      />
      {intro}
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
      <div key={version} className="flex flex-col gap-6">
        {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}

        <Section
          as="fieldset"
          title={a.general}
          icon={<FileText size={20} aria-hidden="true" />}
        >
          <Field
            label={t.ingredients.name}
            name="name"
            defaultValue={val("name")}
            error={err("name")}
            required
          />
          <Field
            label={t.ingredients.description}
            name="description"
            defaultValue={val("description")}
            error={err("description")}
          />
          <SelectField
            label={t.ingredients.unit}
            name="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={[
              { value: "g", label: t.ingredients.unitG },
              { value: "ml", label: t.ingredients.unitMl },
            ]}
            error={err("unit")}
          />
        </Section>

        {/* The label block: heavy rule on top, one row per nutrient. */}
        <Section
          as="fieldset"
          title={fill(t.ingredients.per100, { unit })}
          icon={<ClipboardList size={20} aria-hidden="true" />}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {NUTRIENT_KEYS.map((k) => (
              <Field
                key={k}
                label={t.nutrients[k]}
                name={k}
                inputMode="decimal" // numeric keyboard with a decimal key on phones
                defaultValue={val(k)}
                error={err(k)}
                required
              />
            ))}
          </div>
        </Section>

        <MacroPreview
          title={fill(t.ingredients.previewTitle, { unit })}
          values={current && stripValues(current, locale, 1)}
          empty={t.ingredients.previewEmpty}
          labels={macroLabels(t)}
        >
          <MealImpact
            usedIn={usedIn}
            before={before}
            after={current}
            unit={unit}
            locale={locale}
            t={t}
          />
        </MacroPreview>

        <fieldset className="rule-t-medium border-ink pt-3">
          <p className="pb-2 text-meta text-muted">{t.ingredients.priceHint}</p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label={t.ingredients.price}
              name="packagePrice"
              inputMode="decimal"
              defaultValue={val("packagePrice")}
              error={err("packagePrice")}
            />
            <Field
              label={fill(t.ingredients.packageSize, { unit })}
              name="packageSize"
              inputMode="decimal"
              defaultValue={val("packageSize")}
              error={err("packageSize")}
            />
          </div>
        </fieldset>

        <QualityFields
          nova={val("nova")}
          origin={val("origin")}
          fiberTypes={val("fiberTypes")}
          tags={
            state.status === "error" && state.values.tags
              ? parseTags(state.values.tags)
              : base.tags !== undefined
                ? parseTags(base.tags)
                : tags
          }
          knownTags={knownTags}
          errors={{
            nova: err("nova"),
            origin: err("origin"),
            fiberTypes: err("fiberTypes"),
            tags: err("tags"),
          }}
          t={t}
        />
      </div>
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
