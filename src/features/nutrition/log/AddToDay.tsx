/**
 * features/nutrition/log/AddToDay.tsx — adding to a day: three tabs, one
 * visible at a time, each with its own search and fields:
 *
 *   Meal         search meals        -> servings
 *   Ingredient   search ingredients  -> quantity (in its unit)
 *   Estimate     name, kcal (required), macros, cost (ADR-0009)
 *
 * Each tab shows a PREVIEW (kcal, macros, energy-split bar) of what it would
 * add, updated while typing (core/nutrition/preview.ts), then the planned
 * checkbox, the optional time and Add.
 *
 * Search order: core/shared/search.ts rank + usage in the last 60 days, so
 * the usual foods are at the top of each list. Every tab posts to its own
 * server action (src/app/(app)/actions.ts), which validates, snapshots
 * (ADR-0007) and re-renders. After a successful add the tab's form is
 * remounted empty (useSavedCount); after an error its values stay.
 */
"use client";

import { Calculator, Carrot, Plus, UtensilsCrossed } from "lucide-react";
import { useActionState, useCallback, useMemo, useState, type ReactNode } from "react";
import { stripValues } from "@/core/nutrition/display";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import {
  estimateValues,
  PREVIEW_KEYS,
  scaleMacros,
  type MacroValues,
  type PreviewKey,
} from "@/core/nutrition/preview";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { pickerSearch, type Pickable as SearchItem } from "@/core/shared/search";
import { fill, macroLabels, type Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { MacroPreview } from "@/ui/MacroPreview";
import { Section } from "@/ui/Section";
import { SearchSelect } from "@/ui/SearchSelect";
import { SubmitButton } from "@/ui/SubmitButton";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
type Kind = "meal" | "ingredient" | "estimate";

/** What the search and the preview need about each meal / ingredient. */
export type Pickable = SearchItem & {
  /** Exact values: per serving for a meal, per 100 g/ml for an ingredient. */
  values: MacroValues;
  unit?: string; // ingredients only
};

type T = Pick<
  Messages,
  "day" | "errors" | "meals" | "search" | "macro" | "ingredients" | "nutrients"
>;

type Props = {
  day: string;
  locale: Locale;
  meals: Pickable[];
  ingredients: Pickable[];
  logMealAction: Action;
  logIngredientAction: Action;
  logEstimateAction: Action;
  t: T;
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

export function AddToDay({
  day,
  locale,
  meals,
  ingredients,
  logMealAction,
  logIngredientAction,
  logEstimateAction,
  t,
}: Props) {
  const [kind, setKind] = useState<Kind>("meal");
  // One action state per tab, kept while switching tabs.
  const [mealState, mealAction] = useActionState(logMealAction, IDLE);
  const [ingState, ingAction] = useActionState(logIngredientAction, IDLE);
  const [estState, estAction] = useActionState(logEstimateAction, IDLE);
  const mealKey = useSavedCount(mealState);
  const ingKey = useSavedCount(ingState);
  const estKey = useSavedCount(estState);

  const tabs: { kind: Kind; label: string; icon: ReactNode }[] = [
    {
      kind: "meal",
      label: t.day.meal,
      icon: <UtensilsCrossed size={16} aria-hidden="true" />,
    },
    {
      kind: "ingredient",
      label: t.day.ingredient,
      icon: <Carrot size={16} aria-hidden="true" />,
    },
    {
      kind: "estimate",
      label: t.day.tabEstimate,
      icon: <Calculator size={16} aria-hidden="true" />,
    },
  ];
  const common = { day, locale, t };

  return (
    <Section title={t.day.addTitle} icon={<Plus size={20} aria-hidden="true" />}>
      <div role="tablist" aria-label={t.day.addTitle} className="flex">
        {tabs.map((tab) => {
          const selected = tab.kind === kind;
          return (
            <button
              key={tab.kind}
              type="button"
              role="tab"
              id={`add-tab-${tab.kind}`}
              aria-selected={selected}
              aria-controls="add-panel"
              onClick={() => setKind(tab.kind)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-control px-2 py-2 font-display text-item ${
                selected
                  ? "rule-b-heavy border-ink bg-sheet font-bold text-ink"
                  : "rule-b-medium border-hairline text-muted hover:text-ink"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div id="add-panel" role="tabpanel" aria-labelledby={`add-tab-${kind}`}>
        {kind === "meal" && (
          <PickForm
            key={`m${mealKey}`}
            {...common}
            items={meals}
            per="1"
            idField="mealId"
            amountField="servings"
            amountLabel={t.day.servings}
            defaultAmount="1"
            empty={t.day.noMeals}
            state={mealState}
            action={mealAction}
          />
        )}
        {kind === "ingredient" && (
          <PickForm
            key={`i${ingKey}`}
            {...common}
            items={ingredients}
            per="100"
            idField="ingredientId"
            amountField="quantity"
            amountLabel={t.day.quantity}
            defaultAmount=""
            empty={t.day.noIngredients}
            state={ingState}
            action={ingAction}
          />
        )}
        {kind === "estimate" && (
          <EstimateForm
            key={`e${estKey}`}
            {...common}
            state={estState}
            action={estAction}
          />
        )}
      </div>
    </Section>
  );
}

type PickProps = {
  day: string;
  locale: Locale;
  t: T;
  items: Pickable[];
  /** "1": values are per serving (meals); "100": per 100 g/ml (ingredients). */
  per: "1" | "100";
  idField: "mealId" | "ingredientId";
  amountField: "servings" | "quantity";
  amountLabel: string;
  defaultAmount: string;
  empty: string;
  state: FormState;
  action: (formData: FormData) => void;
};

/** A meal or an ingredient: search, amount, preview, timing, Add. */
function PickForm({
  day,
  locale,
  t,
  items,
  per,
  idField,
  amountField,
  amountLabel,
  defaultAmount,
  empty,
  state,
  action,
}: PickProps) {
  const err = (f: string) => fieldError(state, f, t.errors);
  const kept = (f: string) => (state.status === "error" ? state.values[f] : undefined);
  const [id, setId] = useState(kept(idField) ?? "");
  const [amount, setAmount] = useState(kept(amountField) ?? defaultAmount);

  // Stable across renders (depends only on the dictionary), so the search
  // list isn't rebuilt on every keystroke.
  const hint = useCallback(
    (i: Pickable) =>
      [
        `${formatNumber(i.values.kcal, locale, 0)} ${NUTRIENT_UNIT.kcal}`,
        `${t.macro.protein} ${formatNumber(i.values.protein, locale, 0)}`,
        i.unit ? fill(t.ingredients.per100Short, { unit: i.unit }) : t.meals.perServing,
        i.uses > 0 ? fill(t.search.uses, { n: String(i.uses) }) : "",
      ]
        .filter(Boolean)
        .join(" · "),
    [t, locale],
  );
  const picker = useMemo(() => pickerSearch(items, hint), [items, hint]);

  if (items.length === 0) return <p className="text-meta text-muted">{empty}</p>;
  const chosen = items.find((i) => i.id === id);
  const preview = chosen ? scaleMacros(chosen.values, amount, per) : null;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="day" value={day} />
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <SearchSelect
        label={per === "1" ? t.day.meal : t.day.ingredient}
        name={idField}
        search={picker.search}
        find={picker.find}
        value={id}
        onChange={setId}
        placeholder={t.search.typeToSearch}
        noResults={t.search.noMatches}
        error={err(idField)}
      />
      <Field
        label={chosen?.unit ? `${amountLabel} (${chosen.unit})` : amountLabel}
        name={amountField}
        id={`add-${amountField}`}
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={err(amountField)}
        required
      />
      <Preview values={preview} locale={locale} t={t} />
      <Timing t={t} planned={kept("planned") === "on"} time={kept("time") ?? ""} />
      <div>
        <SubmitButton icon={<Plus size={18} aria-hidden="true" />}>
          {t.day.add}
        </SubmitButton>
      </div>
    </form>
  );
}

type EstimateProps = {
  day: string;
  locale: Locale;
  t: T;
  state: FormState;
  action: (formData: FormData) => void;
};

/** An estimated meal (ADR-0009): a name and approximate totals. */
function EstimateForm({ day, locale, t, state, action }: EstimateProps) {
  const err = (f: string) => fieldError(state, f, t.errors);
  const kept = (f: string) => (state.status === "error" ? state.values[f] : undefined);
  const [typed, setTyped] = useState<Record<PreviewKey, string>>(
    () =>
      Object.fromEntries(PREVIEW_KEYS.map((k) => [k, kept(k) ?? ""])) as Record<
        PreviewKey,
        string
      >,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="day" value={day} />
      <p className="text-meta text-muted">{t.day.estimateHint}</p>
      <Field
        label={t.day.estimateName}
        name="label"
        id="add-label"
        defaultValue={kept("label") ?? ""}
        error={err("label")}
        required
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PREVIEW_KEYS.map((k) => (
          <Field
            key={k}
            label={`${t.nutrients[k]} (${NUTRIENT_UNIT[k]})`}
            name={k}
            id={`add-${k}`}
            inputMode="decimal"
            value={typed[k]}
            onChange={(e) => setTyped((prev) => ({ ...prev, [k]: e.target.value }))}
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
      <Preview values={estimateValues(typed)} locale={locale} t={t} />
      <Timing t={t} planned={kept("planned") === "on"} time={kept("time") ?? ""} />
      <div>
        <SubmitButton icon={<Plus size={18} aria-hidden="true" />}>
          {t.day.add}
        </SubmitButton>
      </div>
    </form>
  );
}

/** What the entry would add (ui/MacroPreview). */
function Preview({
  values,
  locale,
  t,
}: {
  values: MacroValues | null;
  locale: Locale;
  t: T;
}) {
  return (
    <MacroPreview
      title={t.day.preview}
      values={values && stripValues(values, locale)}
      empty={t.day.previewEmpty}
      labels={macroLabels(t)}
    />
  );
}

/** "Planned" checkbox + optional time (ADR-0009). */
function Timing({
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
