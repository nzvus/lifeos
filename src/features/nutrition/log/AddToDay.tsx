/**
 * features/nutrition/log/AddToDay.tsx — THE way to add something to a day:
 * one search over meals AND ingredients, plus "estimated meal" (ADR-0009)
 * as the last option, then only the fields that fit the choice:
 *
 *   meal        -> servings
 *   ingredient  -> quantity (in its unit)
 *   estimate    -> name (prefilled with what you typed), kcal, macros, cost
 *
 * and for all three the planned checkbox and the optional time.
 *
 * Search and order come from core (core/shared/search.ts rank + usage in
 * the last 60 days), meals and ingredients ranked together. Each option's
 * hint says what it is and its energy/protein, so choosing is informed.
 *
 * No new server code: the one form calls one of the three existing actions
 * (src/app/(app)/actions.ts), picked by the choice. After a successful add
 * the form is remounted empty (see useSavedCount); after an error the
 * choice and the typed values stay so they can be fixed.
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

/** What the search needs about each meal / ingredient. */
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
  logEstimateAction: Action;
  t: Pick<
    Messages,
    "day" | "errors" | "meals" | "search" | "macro" | "ingredients" | "nutrients"
  >;
};

/*
 * The chosen value is one string, so it can travel through SearchSelect and
 * come back after an error: "meal:<id>", "ing:<id>" or "estimate:<typed>".
 */
type Choice =
  | { kind: "meal"; id: string }
  | { kind: "ingredient"; id: string; unit: string }
  | { kind: "estimate"; name: string }
  | { kind: "none" };

const ESTIMATE = "estimate:";

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

export function AddToDay(props: Props) {
  const { logMealAction, logIngredientAction, logEstimateAction } = props;
  // One form, three actions: the hidden "kind" field says which one.
  const [state, formAction] = useActionState(async (prev: FormState, data: FormData) => {
    const kind = data.get("kind");
    if (kind === "meal") return logMealAction(prev, data);
    if (kind === "ingredient") return logIngredientAction(prev, data);
    if (kind === "estimate") return logEstimateAction(prev, data);
    return prev; // nothing chosen: the submit button is disabled anyway
  }, IDLE);
  const key = useSavedCount(state);
  return <AddForm key={key} {...props} state={state} formAction={formAction} />;
}

function AddForm({
  day,
  meals,
  ingredients,
  t,
  state,
  formAction,
}: Props & { state: FormState; formAction: (data: FormData) => void }) {
  const err = (f: string) => fieldError(state, f, t.errors);
  const kept = (f: string) => (state.status === "error" ? state.values[f] : undefined);
  const [value, setValue] = useState(kept("choice") ?? "");

  // Stable across renders (depends only on the dictionary), so the search
  // list isn't rebuilt on every keystroke.
  const hint = useCallback(
    (i: Pickable) =>
      [
        i.unit ? t.day.ingredient : t.day.meal,
        `${i.kcal} ${NUTRIENT_UNIT.kcal}`,
        `${t.macro.protein} ${i.protein}`,
        i.unit ? fill(t.ingredients.per100Short, { unit: i.unit }) : t.meals.perServing,
        i.uses > 0 ? fill(t.search.uses, { n: String(i.uses) }) : "",
      ]
        .filter(Boolean)
        .join(" · "),
    [t],
  );

  const picker = useMemo(() => {
    const all = [
      ...meals.map((m) => ({ item: m, value: `meal:${m.id}` })),
      ...ingredients.map((i) => ({ item: i, value: `ing:${i.id}` })),
    ];
    const options = new Map<string, SearchOption>(
      all.map((a) => [
        a.value,
        { value: a.value, label: a.item.name, hint: hint(a.item) },
      ]),
    );
    const estimateOption = (typed: string): SearchOption => ({
      value: `${ESTIMATE}${typed}`,
      label: typed.trim()
        ? fill(t.day.estimateOption, { q: typed.trim() })
        : t.day.estimateOptionBlank,
      hint: t.day.estimateOptionHint,
    });
    const search = (q: string) => [
      ...rank(all, q, (a) => ({
        text: `${a.item.name} ${a.item.notes}`,
        name: a.item.name,
        uses: a.item.uses,
        lastUsed: a.item.lastUsed,
      }))
        .slice(0, 7) // SearchSelect shows 8: keep the last place for the estimate
        .map((a) => options.get(a.value)!),
      estimateOption(q),
    ];
    const find = (v: string) =>
      v.startsWith(ESTIMATE) ? estimateOption(v.slice(ESTIMATE.length)) : options.get(v);
    return { search, find };
  }, [meals, ingredients, hint, t]);

  const choice: Choice = useMemo(() => {
    if (value.startsWith("meal:")) return { kind: "meal", id: value.slice(5) };
    if (value.startsWith("ing:")) {
      const id = value.slice(4);
      return {
        kind: "ingredient",
        id,
        unit: ingredients.find((i) => i.id === id)?.unit ?? "",
      };
    }
    if (value.startsWith(ESTIMATE))
      return { kind: "estimate", name: value.slice(ESTIMATE.length) };
    return { kind: "none" };
  }, [value, ingredients]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rule-t-heavy border-ink pt-3"
    >
      <h2 className="font-display text-section font-bold">{t.day.addTitle}</h2>
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="kind" value={choice.kind} />
      {choice.kind === "meal" && <input type="hidden" name="mealId" value={choice.id} />}
      {choice.kind === "ingredient" && (
        <input type="hidden" name="ingredientId" value={choice.id} />
      )}
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}

      <SearchSelect
        label={t.day.what}
        name="choice"
        search={picker.search}
        find={picker.find}
        value={value}
        onChange={setValue}
        placeholder={t.search.typeToSearch}
        noResults={t.search.noMatches}
        error={err("mealId") ?? err("ingredientId")}
      />

      {choice.kind === "meal" && (
        <Field
          label={t.day.servings}
          name="servings"
          id="add-servings"
          inputMode="decimal"
          defaultValue={kept("servings") ?? "1"}
          error={err("servings")}
          required
        />
      )}

      {choice.kind === "ingredient" && (
        <Field
          label={choice.unit ? `${t.day.quantity} (${choice.unit})` : t.day.quantity}
          name="quantity"
          id="add-quantity"
          inputMode="decimal"
          defaultValue={kept("quantity") ?? ""}
          error={err("quantity")}
          required
          autoFocus
        />
      )}

      {choice.kind === "estimate" && (
        <>
          <p className="text-meta text-muted">{t.day.estimateHint}</p>
          <Field
            label={t.day.estimateName}
            name="label"
            id="add-label"
            defaultValue={kept("label") ?? choice.name.trim()}
            error={err("label")}
            required
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(["kcal", "protein", "carbs", "fat", "fiber"] as const).map((k) => (
              <Field
                key={k}
                label={`${t.nutrients[k]} (${NUTRIENT_UNIT[k]})`}
                name={k}
                id={`add-${k}`}
                inputMode="decimal"
                defaultValue={kept(k) ?? ""}
                error={err(k)}
                required={k === "kcal"}
              />
            ))}
            <Field
              label={t.day.estimateCost}
              name="cost"
              id="add-cost"
              inputMode="decimal"
              defaultValue={kept("cost") ?? ""}
              error={err("cost")}
            />
          </div>
        </>
      )}

      {choice.kind !== "none" && (
        <>
          <TimingFields
            t={t}
            planned={kept("planned") === "on"}
            time={kept("time") ?? ""}
          />
          <div>
            <SubmitButton icon={<Plus size={18} aria-hidden="true" />}>
              {t.day.add}
            </SubmitButton>
          </div>
        </>
      )}
    </form>
  );
}

/** "Planned" checkbox + optional time (ADR-0009). */
function TimingFields({
  t,
  planned,
  time,
}: {
  t: Pick<Messages, "day">;
  planned: boolean;
  time: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex items-center gap-2 text-meta">
        <input
          type="checkbox"
          name="planned"
          id="add-planned"
          defaultChecked={planned}
          className="h-4 w-4 accent-herb"
        />
        {t.day.planned}
      </label>
      <label className="flex flex-col gap-1 text-meta">
        <span className="font-semibold">{t.day.time}</span>
        <input
          type="time"
          name="time"
          id="add-time"
          defaultValue={time}
          className="rule-b-medium border-ink bg-sheet px-2 py-1"
        />
      </label>
      <p className="w-full text-meta text-muted">{t.day.timeHint}</p>
    </div>
  );
}
