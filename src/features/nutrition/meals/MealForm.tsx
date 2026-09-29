/**
 * features/nutrition/meals/MealForm.tsx — create or edit a meal: a name,
 * notes, and a variable-length list of (ingredient, quantity) lines.
 *
 * Same server-action pattern as IngredientForm (see its header), with one
 * twist: the number of lines changes while you edit, so the lines live in
 * React state and are sent as ONE hidden field, `items`, containing JSON:
 *   [{"ingredientId":"…","quantity":"60"}, …]
 * The server action parses it (app/_server/forms.ts parseJsonField) and core
 * validates every line; errors come back keyed "items.2.quantity".
 */
"use client";

import { useActionState, useState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

type Line = { key: number; ingredientId: string; quantity: string };
type IngredientOption = { id: string; name: string; unit: string };

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  ingredients: IngredientOption[];
  initial: {
    name: string;
    notes: string;
    items: { ingredientId: string; quantity: string }[];
  };
  submitLabel: string;
  t: Pick<Messages, "meals" | "errors">;
};

// A counter for React `key`s: each line needs a stable identity so that
// removing line 2 doesn't make React reuse line 2's inputs for line 3.
let nextKey = 0;
const withKeys = (items: { ingredientId: string; quantity: string }[]): Line[] =>
  items.map((i) => ({ ...i, key: nextKey++ }));

export function MealForm({ action, ingredients, initial, submitLabel, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const [lines, setLines] = useState<Line[]>(() =>
    withKeys(initial.items.length ? initial.items : [{ ingredientId: "", quantity: "" }]),
  );
  const err = (field: string) => fieldError(state, field, t.errors);
  const unitOf = (id: string) => ingredients.find((i) => i.id === id)?.unit ?? "";

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Field
        label={t.meals.name}
        name="name"
        defaultValue={valueOf(state, "name", initial.name)}
        error={err("name")}
        required
      />
      <Field
        label={t.meals.notes}
        name="notes"
        defaultValue={valueOf(state, "notes", initial.notes)}
        error={err("notes")}
      />

      <fieldset className="flex flex-col gap-4 border-t-6 border-ink pt-3">
        <legend className="font-display text-xl font-bold">{t.meals.lines}</legend>
        {err("items") && <FormAlert tone="error">{err("items")!}</FormAlert>}
        {lines.map((line, idx) => (
          <div
            key={line.key}
            className="flex items-end gap-3 border-b border-hairline pb-3"
          >
            <SelectField
              label={t.meals.ingredient}
              name={`line-${line.key}-ingredient`} // not read by the server; `items` is
              value={line.ingredientId}
              onChange={(e) => update(line.key, { ingredientId: e.target.value })}
              placeholder={t.meals.choose}
              options={ingredients.map((i) => ({ value: i.id, label: i.name }))}
              error={err(`items.${idx}.ingredientId`)}
              className="flex min-w-0 flex-1 flex-col gap-1"
            />
            <Field
              label={`${t.meals.quantity} ${unitOf(line.ingredientId)}`}
              name={`line-${line.key}-quantity`}
              inputMode="decimal"
              value={line.quantity}
              onChange={(e) => update(line.key, { quantity: e.target.value })}
              error={err(`items.${idx}.quantity`)}
              className="flex w-28 flex-col gap-1"
            />
            <button
              type="button"
              onClick={() => setLines((ls) => ls.filter((l) => l.key !== line.key))}
              className="pb-2 text-sm underline"
            >
              {t.meals.removeLine}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setLines((ls) => [...ls, ...withKeys([{ ingredientId: "", quantity: "" }])])
          }
          className="self-start border-2 border-ink px-3 py-1 font-display font-semibold"
        >
          {t.meals.addLine}
        </button>
      </fieldset>

      {/* What the server actually reads: all lines, in order, as JSON. */}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          lines.map(({ ingredientId, quantity }) => ({ ingredientId, quantity })),
        )}
      />
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
