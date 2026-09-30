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
 */
"use client";

import { ClipboardList } from "lucide-react";
import { useActionState, useState } from "react";
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
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { MacroPreview } from "@/ui/MacroPreview";
import { SelectField } from "@/ui/SelectField";
import { Section } from "@/ui/Section";
import { SubmitButton } from "@/ui/SubmitButton";
import { MealImpact } from "./MealImpact";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Field values to start from: empty for "new", the stored row for "edit". */
  initial: Record<string, string>;
  submitLabel: string;
  locale: Locale;
  /** Meals using this ingredient (edit page), for the live effect preview. */
  usedIn?: readonly MealUse[];
  t: Pick<Messages, "ingredients" | "nutrients" | "errors" | "macro">;
};

/** The five previewed values as typed in the form (strings, maybe invalid). */
const typedValues = (read: (k: PreviewKey) => string) =>
  Object.fromEntries(PREVIEW_KEYS.map((k) => [k, read(k)])) as Record<PreviewKey, string>;

export function IngredientForm({
  action,
  initial,
  submitLabel,
  locale,
  usedIn = [],
  t,
}: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const [unit, setUnit] = useState(initial.unit || "g");
  const err = (field: string) => fieldError(state, field, t.errors);
  const val = (field: string) => valueOf(state, field, initial[field] ?? "");
  // Live preview (core/nutrition/preview.ts): the label as typed, and the
  // label as saved, to show how each meal using it would change.
  const [typed, setTyped] = useState(() => typedValues((k) => val(k)));
  const saved = estimateValues(typedValues((k) => initial[k] ?? ""));
  const current = estimateValues(typed);

  return (
    <form
      action={formAction}
      // Change events bubble: one handler reads the five values after any edit.
      onChange={(e) => {
        const data = new FormData(e.currentTarget);
        setTyped(typedValues((k) => String(data.get(k) ?? "")));
      }}
      className="flex flex-col gap-6"
    >
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}

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
          before={saved}
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

      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
