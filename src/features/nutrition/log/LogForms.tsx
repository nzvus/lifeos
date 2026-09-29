/**
 * features/nutrition/log/LogForms.tsx — the two ways to add to a day:
 * a meal × servings, or a single ingredient × quantity.
 *
 * Both post to server actions (src/app/(app)/actions.ts) with the day in a
 * hidden field; the action validates, snapshots (ADR-0007) and re-renders the
 * page. On success the form resets itself (React 19 default), ready for the
 * next entry.
 */
"use client";

import { useActionState } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

type Props = {
  day: string;
  meals: { id: string; name: string }[];
  ingredients: { id: string; name: string; unit: string }[];
  logMealAction: Action;
  logIngredientAction: Action;
  t: Pick<Messages, "day" | "errors" | "meals">;
};

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
  const mealErr = (f: string) => fieldError(mealState, f, t.errors);
  const ingErr = (f: string) => fieldError(ingState, f, t.errors);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form
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
            <SelectField
              label={t.day.meal}
              name="mealId"
              id="log-meal"
              placeholder={t.meals.choose}
              options={meals.map((m) => ({ value: m.id, label: m.name }))}
              error={mealErr("mealId")}
              required
            />
            <Field
              label={t.day.servings}
              name="servings"
              id="log-servings"
              inputMode="decimal"
              defaultValue="1"
              error={mealErr("servings")}
              required
            />
            <div>
              <SubmitButton>{t.day.add}</SubmitButton>
            </div>
          </>
        )}
      </form>

      <form action={ingAction} className="flex flex-col gap-3 border-t-6 border-ink pt-3">
        <h2 className="font-display text-xl font-bold">{t.day.logIngredient}</h2>
        <input type="hidden" name="day" value={day} />
        {ingredients.length === 0 ? (
          <p className="text-sm text-muted">{t.day.noIngredients}</p>
        ) : (
          <>
            {ingErr("_form") && <FormAlert tone="error">{ingErr("_form")!}</FormAlert>}
            <SelectField
              label={t.day.ingredient}
              name="ingredientId"
              id="log-ingredient"
              placeholder={t.meals.choose}
              options={ingredients.map((i) => ({
                value: i.id,
                label: `${i.name} (${i.unit})`,
              }))}
              error={ingErr("ingredientId")}
              required
            />
            <Field
              label={t.day.quantity}
              name="quantity"
              id="log-quantity"
              inputMode="decimal"
              error={ingErr("quantity")}
              required
            />
            <div>
              <SubmitButton>{t.day.add}</SubmitButton>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
