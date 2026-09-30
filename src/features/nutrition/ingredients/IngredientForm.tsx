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
 * "use client": it needs browser state (the unit selector changes labels).
 */
"use client";

import { useActionState, useState } from "react";
import { NUTRIENT_KEYS } from "@/core/nutrition/nutrients";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Field values to start from: empty for "new", the stored row for "edit". */
  initial: Record<string, string>;
  submitLabel: string;
  t: Pick<Messages, "ingredients" | "nutrients" | "errors">;
};

export function IngredientForm({ action, initial, submitLabel, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const [unit, setUnit] = useState(initial.unit || "g");
  const err = (field: string) => fieldError(state, field, t.errors);
  const val = (field: string) => valueOf(state, field, initial[field] ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
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
      <fieldset className="rule-t-heavy border-ink pt-3">
        <legend className="font-display text-section font-bold">
          {fill(t.ingredients.per100, { unit })}
        </legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
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
      </fieldset>

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
