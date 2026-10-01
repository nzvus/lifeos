/**
 * features/nutrition/log/EntryEditor.tsx — a day's food entry edited as a
 * LOCAL COPY (ADR-0022): change grams, swap an ingredient, add or remove
 * lines, change servings. The meal it came from is not touched; a kept line
 * keeps the values it was logged with, a new or swapped one takes the
 * ingredient's values now. Same edit model as the meal editor (ADR-0015):
 * ActionBar, Save + Undo back to the day. Client component.
 */
"use client";

import { Carrot, X } from "lucide-react";
import { useMemo, useState } from "react";
import { stripValues } from "@/core/nutrition/display";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { scaleMacros, sumMacros, type MacroValues } from "@/core/nutrition/preview";
import type { Locale } from "@/core/shared/locales";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { pickerSearch } from "@/core/shared/search";
import { fill, macroLabels, type Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { buttonClass } from "@/ui/button";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { MacroPreview } from "@/ui/MacroPreview";
import { PageHeader } from "@/ui/PageHeader";
import { SearchSelect } from "@/ui/SearchSelect";
import { Section } from "@/ui/Section";
import { useEditFlow } from "@/ui/useEditFlow";

type Item = {
  itemId?: string;
  ingredientId: string;
  quantity: string;
  /** The logged line's name, unit and values (kept lines). */
  name?: string;
  unit?: string;
  values?: MacroValues;
};
type Line = Item & { key: number };
type Snapshot = { servings: string; items: Item[] };

const sent = (items: Item[]) =>
  items.map(({ itemId, ingredientId, quantity }) => ({
    ...(itemId ? { itemId } : {}),
    ...(ingredientId ? { ingredientId } : {}),
    quantity,
  }));
const toFormData = (s: Snapshot) => {
  const fd = new FormData();
  fd.set("servings", s.servings);
  fd.set("items", JSON.stringify(sent(s.items)));
  return fd;
};

let nextKey = 1_000_000;

export function EntryEditor({
  id,
  title,
  fromMeal,
  from,
  action,
  ingredients,
  initial,
  locale,
  t,
}: {
  id: string;
  title: string;
  /** Logged from a meal: say that the meal stays as it is. */
  fromMeal: boolean;
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  ingredients: {
    id: string;
    name: string;
    unit: string;
    kcal: string;
    protein: string;
    notes: string;
    uses: number;
    lastUsed: string | null;
    values: MacroValues;
  }[];
  initial: Snapshot;
  locale: Locale;
  t: Pick<
    Messages,
    | "meals"
    | "errors"
    | "search"
    | "macro"
    | "ingredients"
    | "nutrients"
    | "actions"
    | "day"
    | "entryEdit"
  >;
}) {
  const a = t.actions;
  const [servings, setServings] = useState(initial.servings);
  const [lines, setLines] = useState<Line[]>(() =>
    initial.items.map((it, key) => ({ ...it, key })),
  );
  const dirty =
    JSON.stringify({ servings, items: sent(lines) }) !==
    JSON.stringify({ servings: initial.servings, items: sent(initial.items) });
  const { state, formAction } = useEditFlow({
    id,
    from,
    idle: IDLE,
    action,
    previous: () => toFormData(initial),
    name: () => title,
    labels: a,
  });
  const err = (f: string) => fieldError(state, f, t.errors);
  const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
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
  const initialIngredient = new Map(initial.items.map((i) => [i.itemId, i.ingredientId]));
  /** A line's values: the logged ones while it is the same ingredient, else today's. */
  const valuesOf = (l: Line) =>
    l.values && l.itemId && initialIngredient.get(l.itemId) === l.ingredientId
      ? l.values
      : byId.get(l.ingredientId)?.values;
  const total = useMemo(() => {
    const parts = lines
      .map((l) => {
        const v = valuesOf(l);
        return v ? scaleMacros(v, l.quantity, "100") : null;
      })
      .filter((p) => p !== null);
    return parts.length ? scaleMacros(sumMacros(parts), servings, "1") : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, servings, byId]);
  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <PageHeader title={title} back={{ href: from, label: a.back }} />
      <FormAlert tone="info">
        {fromMeal ? t.entryEdit.copyMeal : t.entryEdit.copy}
      </FormAlert>
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Section
        as="fieldset"
        title={t.meals.lines}
        icon={<Carrot size={20} aria-hidden="true" />}
      >
        {err("items") && <FormAlert tone="error">{err("items")!}</FormAlert>}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t.day.servings}
            name="servings"
            inputMode="decimal"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            error={err("servings")}
          />
        </div>
        {lines.map((line, idx) => (
          <div
            key={line.key}
            className="flex items-end gap-3 rule-b-medium border-hairline pb-3"
          >
            <SearchSelect
              label={t.meals.ingredient}
              name={`line-${line.key}-ingredient`}
              value={line.ingredientId}
              onChange={(v) => update(line.key, { ingredientId: v })}
              search={picker.search}
              find={(v) =>
                picker.find(v) ??
                (line.name && v === line.ingredientId
                  ? { value: v, label: line.name }
                  : undefined)
              }
              placeholder={line.name ?? t.search.typeToSearch}
              noResults={t.search.noMatches}
              error={err(`items.${idx}.ingredientId`)}
              className="flex min-w-0 flex-1 flex-col gap-1"
            />
            <Field
              label={`${t.meals.quantity} ${byId.get(line.ingredientId)?.unit ?? line.unit ?? ""}`}
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
              aria-label={t.meals.removeLine}
              title={t.meals.removeLine}
              className={buttonClass({ variant: "quiet", iconOnly: true })}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setLines((ls) => [...ls, { key: nextKey++, ingredientId: "", quantity: "" }])
          }
          className={`self-start ${buttonClass()}`}
        >
          {t.meals.addLine}
        </button>
      </Section>
      <MacroPreview
        title={t.entryEdit.total}
        values={total && stripValues(total, locale)}
        empty={t.meals.previewEmpty}
        labels={macroLabels(t)}
      />
      <input type="hidden" name="items" value={JSON.stringify(sent(lines))} />
      <ActionBar
        dirty={dirty}
        isNew={false}
        onRestore={() => {
          setServings(initial.servings);
          setLines(initial.items.map((it, key) => ({ ...it, key })));
        }}
        cancelHref={from}
        labels={{ save: a.save, cancel: a.cancel, restore: a.restore, saving: a.saving }}
      />
    </form>
  );
}
