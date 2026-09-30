/**
 * features/nutrition/log/LogForms.tsx — the two ways to add to a day:
 * a meal × servings, or a single ingredient × quantity.
 *
 * Both pickers are searchable (ui/SearchSelect): type a few letters, or pick
 * from the top of the list, which is ordered by how often you logged each
 * item in the last 60 days (core/shared/search.ts rank + usage counts). Each
 * option shows a hint (energy and protein) so choosing is informed.
 *
 * Both post to server actions (src/app/(app)/actions.ts) with the day in a
 * hidden field; the action validates, snapshots (ADR-0007) and re-renders.
 * After a successful add, the form is remounted empty (see useSavedCount),
 * ready for the next entry; after an error, the choice stays so it can be
 * fixed.
 */
"use client";

import { Plus } from "lucide-react";
import { useActionState, useCallback, useMemo, useState } from "react";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { rank } from "@/core/shared/search";
import { fill, type Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SearchSelect, type SearchOption } from "@/ui/SearchSelect";
import { SubmitButton } from "@/ui/SubmitButton";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** What the pickers need about each meal / ingredient. */
export type Pickable = {
  id: string;
  name: string;
  /** Already formatted for display by the page ("372", "13,5"). */
  kcal: string;
  protein: string;
  uses: number;
  lastUsed: string | null;
  /** Notes/description: searched too ("Lidl", "STIMA", "senza lattosio"). */
  notes: string;
  unit?: string; // ingredients only
};

type Props = {
  day: string;
  meals: Pickable[];
  ingredients: Pickable[];
  logMealAction: Action;
  logIngredientAction: Action;
  t: Pick<Messages, "day" | "errors" | "meals" | "search" | "macro" | "ingredients">;
};

/**
 * Counts successful submissions. Changing a component's `key` makes React
 * throw it away and mount a fresh one, which is the simplest reliable way to
 * reset a form's internal state after "saved". (Updating state while
 * rendering, when the action's result changes, is the React-documented
 * pattern for "adjust state when a prop/value changes".)
 */
function useSavedCount(state: FormState): number {
  const [count, setCount] = useState(0);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.status === "saved") setCount((c) => c + 1);
  }
  return count;
}

/** Builds search/find functions for a SearchSelect from a list of items. */
function usePicker(items: Pickable[], hint: (i: Pickable) => string) {
  return useMemo(() => {
    const options = new Map<string, SearchOption>(
      items.map((i) => [i.id, { value: i.id, label: i.name, hint: hint(i) }]),
    );
    const search = (q: string) =>
      rank(items, q, (i) => ({
        text: `${i.name} ${i.notes}`,
        name: i.name,
        uses: i.uses,
        lastUsed: i.lastUsed,
      })).map((i) => options.get(i.id)!);
    const find = (value: string) => options.get(value);
    return { search, find };
  }, [items, hint]);
}

export function LogForms({
  day,
  meals,
  ingredients,
  logMealAction,
  logIngredientAction,
  t,
}: Props) {
  const [mealState, mealAction] = useActionState(logMealAction, IDLE);
  const [ingState, ingAction] = useActionState(logIngredientAction, IDLE);
  const mealKey = useSavedCount(mealState);
  const ingKey = useSavedCount(ingState);
  const mealErr = (f: string) => fieldError(mealState, f, t.errors);
  const ingErr = (f: string) => fieldError(ingState, f, t.errors);

  // Stable across renders (depends only on the dictionary), so the pickers'
  // memoised search lists aren't rebuilt on every keystroke.
  const macroHint = useCallback(
    (i: Pickable) =>
      `${i.kcal} ${NUTRIENT_UNIT.kcal} · ${t.macro.protein} ${i.protein}` +
      (i.unit
        ? ` · ${fill(t.ingredients.per100Short, { unit: i.unit })}`
        : ` · ${t.meals.perServing}`) +
      (i.uses > 0 ? ` · ${fill(t.search.uses, { n: String(i.uses) })}` : ""),
    [t],
  );
  const mealPicker = usePicker(meals, macroHint);
  const ingPicker = usePicker(ingredients, macroHint);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form
        key={`m${mealKey}`}
        action={mealAction}
        className="flex flex-col gap-3 border-t-6 border-ink pt-3"
      >
        <h2 className="font-display text-xl font-bold">{t.day.logMeal}</h2>
        <input type="hidden" name="day" value={day} />
        {meals.length === 0 ? (
          <p className="text-sm text-muted">{t.day.noMeals}</p>
        ) : (
          <>
            {mealErr("_form") && <FormAlert tone="error">{mealErr("_form")!}</FormAlert>}
            <SearchSelect
              label={t.day.meal}
              name="mealId"
              search={mealPicker.search}
              find={mealPicker.find}
              defaultValue={
                mealState.status === "error" ? (mealState.values.mealId ?? "") : ""
              }
              placeholder={t.search.typeToSearch}
              noResults={t.search.noMatches}
              error={mealErr("mealId")}
            />
            <Field
              label={t.day.servings}
              name="servings"
              id="log-servings"
              inputMode="decimal"
              defaultValue={
                mealState.status === "error" ? mealState.values.servings : "1"
              }
              error={mealErr("servings")}
              required
            />
            <div>
              <SubmitButton icon={<Plus size={18} aria-hidden="true" />}>
                {t.day.add}
              </SubmitButton>
            </div>
          </>
        )}
      </form>

      <form
        key={`i${ingKey}`}
        action={ingAction}
        className="flex flex-col gap-3 border-t-6 border-ink pt-3"
      >
        <h2 className="font-display text-xl font-bold">{t.day.logIngredient}</h2>
        <input type="hidden" name="day" value={day} />
        {ingredients.length === 0 ? (
          <p className="text-sm text-muted">{t.day.noIngredients}</p>
        ) : (
          <>
            {ingErr("_form") && <FormAlert tone="error">{ingErr("_form")!}</FormAlert>}
            <SearchSelect
              label={t.day.ingredient}
              name="ingredientId"
              search={ingPicker.search}
              find={ingPicker.find}
              defaultValue={
                ingState.status === "error" ? (ingState.values.ingredientId ?? "") : ""
              }
              placeholder={t.search.typeToSearch}
              noResults={t.search.noMatches}
              error={ingErr("ingredientId")}
            />
            <Field
              label={t.day.quantity}
              name="quantity"
              id="log-quantity"
              inputMode="decimal"
              defaultValue={ingState.status === "error" ? ingState.values.quantity : ""}
              error={ingErr("quantity")}
              required
            />
            <div>
              <SubmitButton icon={<Plus size={18} aria-hidden="true" />}>
                {t.day.add}
              </SubmitButton>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
