/**
 * features/nutrition/log/LiveLines.tsx — an entry's ingredients, edited in
 * its open row (2026-10-11: "edit the ingredients on the page itself";
 * then: "follow the multiplier, add ingredients, show their data").
 *
 * Each line shows what was EATEN: its amount with the entry's × included,
 * and its macro strip. Changing an amount, taking a line out or adding an
 * ingredient changes the day's numbers at once (LiveDay, optimistic) and
 * saves behind; the server keeps the logged values of kept lines and takes
 * an added ingredient's values now (ADR-0022, the same as EntryEditor).
 * An amount typed for the eaten total is stored per serving (÷ ×).
 * Client component.
 */
"use client";

import Big from "big.js";
import { Check, Plus, X } from "lucide-react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { stripValues } from "@/core/nutrition/display";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { MacroValues } from "@/core/nutrition/preview";
import { servingsText } from "@/core/nutrition/servings";
import { sumLines, toDisplay, type TotalsLine } from "@/core/nutrition/totals";
import { parseDecimalInput } from "@/core/shared/decimal";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { IDLE, fieldError, type FormState } from "@/core/shared/result";
import { pickerSearch } from "@/core/shared/search";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { MacroStrip, type MacroStripLabels } from "@/ui/MacroStrip";
import { SearchSelect } from "@/ui/SearchSelect";
import { useLiveEntry } from "./LiveDay";
import type { Pickable } from "./AddToDay";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** A line as the server logged it (kept), or one added here (new). */
type Line = TotalsLine & {
  key: string;
  name: string;
  unit: string;
  itemId?: string;
  ingredientId?: string;
};

/**
 * The ingredients that can be added, given once for the whole day (not
 * once per entry: the list is long).
 */
const Addable = createContext<readonly Pickable[]>([]);
export function AddableIngredients({
  ingredients,
  children,
}: {
  ingredients: readonly Pickable[];
  children: ReactNode;
}) {
  return <Addable.Provider value={ingredients}>{children}</Addable.Provider>;
}

export type LoggedLineView = TotalsLine & { itemId: string; name: string; unit: string };

export function LiveLines({
  id,
  lines: logged,
  action,
  locale,
  labels,
  t,
}: {
  id: string;
  lines: readonly LoggedLineView[];
  action: Action;
  locale: Locale;
  labels: MacroStripLabels;
  t: Pick<Messages, "entryEdit" | "errors" | "settings" | "search" | "actions">;
}) {
  const { entry, patch } = useLiveEntry(id);
  // What can be added (the add sheet's list: values per 100 g/ml).
  const ingredients = useContext(Addable);
  const servings = entry?.servings ?? "1";
  const [lines, setLines] = useState<Line[]>(() =>
    logged.map((l) => ({ ...l, key: l.itemId })),
  );
  const [state, setState] = useState<FormState>(IDLE);
  const [saving, startSaving] = useTransition();
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState("");
  const [pickAmount, setPickAmount] = useState("");
  const e = t.entryEdit;

  const picker = useMemo(
    () =>
      pickerSearch(
        ingredients,
        (i) =>
          `${formatNumber(i.values.kcal, locale, 0)} ${NUTRIENT_UNIT.kcal} · ${i.unit ?? "g"}`,
      ),
    [ingredients, locale],
  );

  const eaten = (l: Line) => new Big(l.quantity).times(servings);
  // Whole grams from 10 up (57.14 × 1.75 is "100", not "100.0"); one
  // decimal below, and none when it is whole.
  const show = (v: Big) => {
    const d = v.gte(10) || v.round(1).round(0).eq(v.round(1)) ? 0 : 1;
    return formatNumber(v.round(d).toString(), locale, d);
  };

  const save = (next: Line[]) => {
    setLines(next);
    const fd = new FormData();
    fd.set("servings", servings);
    fd.set(
      "items",
      JSON.stringify(
        next.map((l) => ({
          ...(l.itemId ? { itemId: l.itemId } : { ingredientId: l.ingredientId }),
          quantity: l.quantity,
        })),
      ),
    );
    startSaving(async () => {
      patch({ id, lines: next });
      setState(await action(IDLE, fd));
    });
  };

  /** An amount typed for the eaten total, stored per serving (2 decimals). */
  const perServing = (raw: string): string | null => {
    const v = parseDecimalInput(raw);
    if (v === null || new Big(v).lte(0)) return null;
    return new Big(v).div(servings).round(2).toString();
  };

  const setAmount = (key: string, raw: string) => {
    const q = perServing(raw);
    const line = lines.find((l) => l.key === key);
    if (!q || !line || new Big(q).eq(line.quantity)) return;
    save(lines.map((l) => (l.key === key ? { ...l, quantity: q } : l)));
  };

  const add = () => {
    const ing = ingredients.find((i) => i.id === pick);
    const q = perServing(pickAmount);
    if (!ing || !q) return;
    save([
      ...lines,
      {
        key: `new-${ing.id}-${lines.length}`,
        ingredientId: ing.id,
        name: ing.name,
        unit: ing.unit ?? "g",
        quantity: q,
        per100: ing.values as MacroValues,
        packagePriceCents: null,
        packageSize: null,
      },
    ]);
    setAdding(false);
    setPick("");
    setPickAmount("");
  };

  const error =
    fieldError(state, "items", t.errors) ?? fieldError(state, "_form", t.errors);
  return (
    <section className="flex flex-col gap-1" aria-label={e.ingredients}>
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-meta font-semibold">{e.ingredients}</h4>
        {Number(servings) !== 1 && (
          <span className="text-meta text-muted">
            {fill(e.eatenAmounts, { n: servingsText(Number(servings), locale) })}
          </span>
        )}
      </div>
      <ul className="flex flex-col divide-y divide-hairline">
        {lines.map((l) => (
          <li
            key={`${l.key}-${l.quantity}-${servings}`}
            className="flex flex-col gap-1 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 font-semibold wrap-break-word">
                {l.name}
              </span>
              <label className="flex shrink-0 items-baseline gap-1">
                <span className="sr-only">{fill(e.amountOf, { name: l.name })}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  defaultValue={show(eaten(l))}
                  onBlur={(ev) => setAmount(l.key, ev.currentTarget.value)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") ev.currentTarget.blur();
                  }}
                  className="w-16 rule-b-medium border-ink bg-transparent py-1 text-right font-display text-item font-semibold tabular-nums outline-none focus-visible:border-focus"
                />
                <span className="w-6 text-meta text-muted">{l.unit}</span>
              </label>
              <button
                type="button"
                onClick={() => save(lines.filter((x) => x.key !== l.key))}
                disabled={lines.length === 1}
                title={lines.length === 1 ? e.lastLine : undefined}
                aria-label={fill(e.removeLine, { name: l.name })}
                className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <MacroStrip
              values={stripValues(toDisplay(sumLines([l], servings)).nutrients, locale)}
              labels={labels}
            />
          </li>
        ))}
      </ul>
      {adding ? (
        <div className="flex flex-col gap-2 rounded-control bg-paper p-2">
          <SearchSelect
            label={e.add}
            name="add-ingredient"
            value={pick}
            onChange={setPick}
            search={picker.search}
            find={picker.find}
            placeholder={t.search.typeToSearch}
            noResults={t.search.noMatches}
          />
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-meta text-muted">{e.amount}</span>
              <span className="flex items-baseline gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={pickAmount}
                  onChange={(ev) => setPickAmount(ev.currentTarget.value)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") add();
                  }}
                  className="w-20 rule-b-medium border-ink bg-transparent py-1 text-right font-display text-item font-semibold tabular-nums outline-none focus-visible:border-focus"
                />
                <span className="text-meta text-muted">
                  {ingredients.find((i) => i.id === pick)?.unit ?? "g"}
                </span>
              </span>
            </label>
            <button
              type="button"
              onClick={add}
              disabled={!pick || !perServing(pickAmount)}
              className={buttonClass({ size: "sm" })}
            >
              {e.addConfirm}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className={buttonClass({ variant: "quiet", size: "sm" })}
            >
              {t.actions.cancel}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={`${buttonClass({ variant: "quiet", size: "sm" })} self-start`}
        >
          <Plus size={16} aria-hidden="true" />
          {e.add}
        </button>
      )}
      {/* Not a form submit: SaveStatus reads useFormStatus, so the status is here. */}
      <p aria-live="polite" className="min-h-5 text-meta text-muted">
        {saving ? (
          t.settings.autoSaving
        ) : state.status === "saved" ? (
          <span className="inline-flex items-center gap-1 text-herb">
            <Check size={14} aria-hidden="true" />
            {t.settings.saved}
          </span>
        ) : null}
      </p>
      {error && <span className="text-meta text-tomato">{error}</span>}
    </section>
  );
}
