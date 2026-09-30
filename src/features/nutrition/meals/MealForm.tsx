/**
 * features/nutrition/meals/MealForm.tsx — create or edit a meal: a name,
 * notes, and a variable-length list of (ingredient, quantity) lines.
 *
 * Ingredients are chosen with a searchable picker (ui/SearchSelect), most
 * used first. Same server-action pattern as IngredientForm (see its header),
 * with one twist: the number of lines changes while you edit, so the lines live in
 * React state and are sent as ONE hidden field, `items`, containing JSON:
 *   [{"ingredientId":"…","quantity":"60"}, …]
 * The server action parses it (app/_server/forms.ts parseJsonField) and core
 * validates every line; errors come back keyed "items.2.quantity".
 * Under the lines, a live preview of one serving (ui/MacroPreview).
 */
"use client";

import { Carrot } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { stripValues } from "@/core/nutrition/display";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { scaleMacros, sumMacros, type MacroValues } from "@/core/nutrition/preview";
import type { Locale } from "@/core/shared/locales";
import { pickerSearch } from "@/core/shared/search";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, macroLabels, type Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { MacroPreview } from "@/ui/MacroPreview";
import { SearchSelect } from "@/ui/SearchSelect";
import { Section } from "@/ui/Section";
import { SubmitButton } from "@/ui/SubmitButton";

type Line = { key: number; ingredientId: string; quantity: string };
/** An ingredient the editor can offer. kcal/protein are display strings. */
type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  kcal: string;
  protein: string;
  uses: number;
  lastUsed: string | null;
  /** Searched too, like the name. */
  notes: string;
  /** Exact per-100 values, for the live serving preview. */
  values: MacroValues;
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  ingredients: IngredientOption[];
  initial: {
    name: string;
    notes: string;
    items: { ingredientId: string; quantity: string }[];
  };
  submitLabel: string;
  locale: Locale;
  t: Pick<
    Messages,
    "meals" | "errors" | "search" | "macro" | "ingredients" | "nutrients"
  >;
};

// A counter for React `key`s: each line needs a stable identity so that
// removing line 2 doesn't make React reuse line 2's inputs for line 3.
let nextKey = 0;
const withKeys = (items: { ingredientId: string; quantity: string }[]): Line[] =>
  items.map((i) => ({ ...i, key: nextKey++ }));

export function MealForm({
  action,
  ingredients,
  initial,
  submitLabel,
  locale,
  t,
}: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const [lines, setLines] = useState<Line[]>(() =>
    withKeys(initial.items.length ? initial.items : [{ ingredientId: "", quantity: "" }]),
  );
  const err = (field: string) => fieldError(state, field, t.errors);
  const unitOf = (id: string) => ingredients.find((i) => i.id === id)?.unit ?? "";

  // Searchable ingredient picker, most used first (core/shared/search.ts).
  const picker = useMemo(
    () =>
      pickerSearch(
        ingredients,
        (i) =>
          `${i.kcal} ${NUTRIENT_UNIT.kcal} · ${t.macro.protein} ${i.protein} · ` +
          fill(t.ingredients.per100Short, { unit: i.unit }),
      ),
    [ingredients, t],
  );

  // One serving as it is being composed: the lines that already have an
  // ingredient and a valid quantity, summed (core/nutrition/preview.ts).
  const serving = useMemo(() => {
    const byId = new Map(ingredients.map((i) => [i.id, i]));
    const parts = lines
      .map((l) => {
        const ing = byId.get(l.ingredientId);
        return ing ? scaleMacros(ing.values, l.quantity, "100") : null;
      })
      .filter((p) => p !== null);
    return parts.length === 0 ? null : sumMacros(parts);
  }, [lines, ingredients]);

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

      <Section
        as="fieldset"
        title={t.meals.lines}
        icon={<Carrot size={20} aria-hidden="true" />}
      >
        {err("items") && <FormAlert tone="error">{err("items")!}</FormAlert>}
        {lines.map((line, idx) => (
          <div
            key={line.key}
            className="flex items-end gap-3 border-b border-hairline pb-3"
          >
            <SearchSelect
              label={t.meals.ingredient}
              name={`line-${line.key}-ingredient`} // not read by the server; `items` is
              value={line.ingredientId}
              onChange={(id) => update(line.key, { ingredientId: id })}
              search={picker.search}
              find={picker.find}
              placeholder={t.search.typeToSearch}
              noResults={t.search.noMatches}
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
              className="pb-2 text-meta underline"
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
          className="self-start rule-medium border-ink px-3 py-1 font-display font-semibold"
        >
          {t.meals.addLine}
        </button>
      </Section>

      <MacroPreview
        title={t.meals.previewTitle}
        values={serving && stripValues(serving, locale)}
        empty={t.meals.previewEmpty}
        labels={macroLabels(t)}
      />

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
