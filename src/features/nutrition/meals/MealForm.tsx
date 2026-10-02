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
 *
 * ADR-0015, the app's edit model, first applied here:
 *   - the page header: "←" back to where you came from (`from`), the title,
 *     and a "⋯" menu with Duplicate and Delete (to the trash, with Undo);
 *   - every field is controlled, so the form knows when it differs from
 *     what is saved (`dirty`): the pinned ui/ActionBar then offers ↺ (back
 *     to the saved version), Cancel and Save;
 *   - unsaved changes stay in this browser (ui/useDraft) and are offered
 *     back on the next visit;
 *   - saving goes back to `from` with "Saved · Undo" (Undo saves the
 *     previous version again).
 */
"use client";

import { Carrot, Copy, FileText, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { stripValues } from "@/core/nutrition/display";
import { MOMENTS } from "@/core/nutrition/moments";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { scaleMacros, sumMacros, type MacroValues } from "@/core/nutrition/preview";
import type { Locale } from "@/core/shared/locales";
import { pickerSearch } from "@/core/shared/search";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { fill, macroLabels, type Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { MacroPreview } from "@/ui/MacroPreview";
import { DeleteButton } from "@/ui/DeleteButton";
import { Menu } from "@/ui/Menu";
import { MomentIcon } from "@/ui/MomentIcon";
import { PageHeader } from "@/ui/PageHeader";
import { StarInput } from "@/ui/StarRating";
import { SearchSelect } from "@/ui/SearchSelect";
import { SelectField } from "@/ui/SelectField";
import { Section } from "@/ui/Section";
import { useDraft } from "@/ui/useDraft";
import { useEditFlow } from "@/ui/useEditFlow";
import { buttonClass, TEXT_LINK } from "@/ui/button";

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

/** Everything the form edits, as plain data: compared, kept as a draft, restored. */
type Snapshot = {
  name: string;
  notes: string;
  category: string;
  review: string;
  ratings: Record<string, number>;
  items: { ingredientId: string; quantity: string }[];
};

/** The same snapshot always serialises the same way (ratings sorted). */
const canon = (s: Snapshot) =>
  JSON.stringify({
    ...s,
    ratings: Object.entries(s.ratings).sort(([a], [b]) => a.localeCompare(b)),
  });

/** A snapshot as the fields the server action reads. */
function toFormData(s: Snapshot): FormData {
  const fd = new FormData();
  fd.set("name", s.name);
  fd.set("notes", s.notes);
  fd.set("category", s.category);
  fd.set("review", s.review);
  fd.set(
    "ratings",
    JSON.stringify(
      Object.entries(s.ratings).map(([factorId, score]) => ({ factorId, score })),
    ),
  );
  fd.set("items", JSON.stringify(s.items));
  return fd;
}

type Props = {
  /** The meal being edited; absent for a new one. */
  id?: string;
  title: string;
  /** Where back, Cancel and "after saving" lead (core/shared/navigation safeFrom). */
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Trash and restore (ADR-0015); only for an existing meal. */
  trash?: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore?: (id: string) => Promise<{ ok: boolean; message?: string }>;
  ingredients: IngredientOption[];
  /** ADR-0011: category "" for none; ADR-0012: review and scores by factor id. */
  initial: Snapshot;
  locale: Locale;
  /** My rating factors (ADR-0012), in order. */
  factors: { id: string; name: string }[];
  t: Pick<
    Messages,
    | "meals"
    | "errors"
    | "search"
    | "macro"
    | "ingredients"
    | "nutrients"
    | "moments"
    | "ratings"
    | "actions"
  >;
};

// React `key`s: each line needs a stable identity so that removing line 2
// doesn't make React reuse line 2's inputs for line 3. The first render's
// lines are keyed by position, the same on the server and in the browser
// (a shared counter differed between them: a hydration mismatch); lines
// added later take numbers from a counter far above any position.
let nextKey = 1_000_000;
const firstKeys = (items: { ingredientId: string; quantity: string }[]): Line[] =>
  items.map((i, key) => ({ ...i, key }));
const withKeys = (items: { ingredientId: string; quantity: string }[]): Line[] =>
  items.map((i) => ({ ...i, key: nextKey++ }));

export function MealForm({
  id,
  title,
  from,
  action,
  trash,
  restore,
  ingredients,
  initial,
  locale,
  factors,
  t,
}: Props) {
  const a = t.actions;
  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [category, setCategory] = useState(initial.category);
  const [review, setReview] = useState(initial.review);
  const [scores, setScores] = useState<Record<string, number>>(initial.ratings);
  const [lines, setLines] = useState<Line[]>(() =>
    firstKeys(
      initial.items.length ? initial.items : [{ ingredientId: "", quantity: "" }],
    ),
  );
  const current: Snapshot = {
    name,
    notes,
    category,
    review,
    ratings: scores,
    items: lines.map(({ ingredientId, quantity }) => ({ ingredientId, quantity })),
  };
  const initialItems = initial.items.length
    ? initial.items
    : [{ ingredientId: "", quantity: "" }];
  const dirty = canon(current) !== canon({ ...initial, items: initialItems });
  const draft = useDraft(`meal:${id ?? "new"}`, current, dirty);

  const load = (s: Snapshot) => {
    setName(s.name);
    setNotes(s.notes);
    setCategory(s.category);
    setReview(s.review);
    setScores(s.ratings);
    setLines(withKeys(s.items.length ? s.items : [{ ingredientId: "", quantity: "" }]));
  };

  const { state, formAction, onDelete } = useEditFlow({
    id,
    from,
    idle: IDLE,
    action,
    previous: () => toFormData(initial),
    name: () => name.trim() || initial.name,
    trash,
    restore,
    done: draft.clear,
    labels: a,
  });
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
      <PageHeader
        title={title}
        back={{ href: from, label: from === "/meals" ? t.meals.back : a.back }}
        menu={
          id && trash ? (
            <span className="flex items-center gap-1">
              <Menu
                label={a.more}
                items={[
                  {
                    label: a.duplicate,
                    icon: <Copy size={16} aria-hidden="true" />,
                    href: `/meals/new?copy=${id}`,
                  },
                ]}
              />
              {onDelete && (
                <DeleteButton
                  onConfirm={() => void onDelete()}
                  title={fill(a.confirmDelete, { name: name.trim() || initial.name })}
                  hint={a.confirmDeleteHint}
                  labels={a}
                />
              )}
            </span>
          ) : undefined
        }
      />
      {draft.found && canon(draft.found) !== canon(current) && (
        <FormAlert tone="info">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{a.draftFound}</span>
            <button
              type="button"
              onClick={() => {
                load(draft.found!);
                draft.clear();
              }}
              className="font-semibold underline"
            >
              {a.draftRestore}
            </button>
            <button type="button" onClick={draft.clear} className={TEXT_LINK}>
              {a.draftDiscard}
            </button>
          </span>
        </FormAlert>
      )}
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Section
        as="fieldset"
        title={a.general}
        icon={<FileText size={20} aria-hidden="true" />}
      >
        <Field
          label={t.meals.name}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={err("name")}
          required
        />
        <Field
          label={t.meals.notes}
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={err("notes")}
        />
        <SelectField
          label={t.moments.categoryLabel}
          icon={<MomentIcon moment={category || null} />}
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: "", label: t.moments.categoryNone },
            ...MOMENTS.map((m) => ({ value: m, label: t.moments.names[m] })),
          ]}
          error={err("category")}
        />
        <p className="-mt-2 text-meta text-muted">{t.moments.categoryHint}</p>
      </Section>

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
            setLines((ls) => [...ls, ...withKeys([{ ingredientId: "", quantity: "" }])])
          }
          className={`self-start ${buttonClass()}`}
        >
          {t.meals.addLine}
        </button>
      </Section>

      <Section
        as="fieldset"
        title={t.ratings.title}
        icon={<Star size={20} aria-hidden="true" />}
      >
        {factors.length === 0 ? (
          <p className="text-meta text-muted">{t.ratings.noFactors}</p>
        ) : (
          factors.map((f) => (
            <StarInput
              key={f.id}
              name={`rating-${f.id}`} // not read by the server; `ratings` is
              label={f.name}
              value={scores[f.id] ?? null}
              onChange={(v) =>
                setScores((prev) => {
                  const next = { ...prev };
                  if (v === null) delete next[f.id];
                  else next[f.id] = v;
                  return next;
                })
              }
              labels={{
                score: (n) => fill(t.ratings.score, { n: String(n) }),
                none: t.ratings.none,
              }}
            />
          ))
        )}
        {err("ratings") && <FormAlert tone="error">{err("ratings")!}</FormAlert>}
        <label className="flex flex-col gap-1 text-meta">
          <span className="font-semibold">{t.ratings.review}</span>
          <textarea
            name="review"
            rows={3}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="rounded-control rule-b-medium border-ink bg-sheet px-2 py-1.5 text-body"
          />
        </label>
        <input
          type="hidden"
          name="ratings"
          value={JSON.stringify(
            Object.entries(scores).map(([factorId, score]) => ({ factorId, score })),
          )}
        />
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
      <ActionBar
        dirty={dirty}
        isNew={!id}
        onRestore={() => load({ ...initial, items: initialItems })}
        cancelHref={from}
        labels={{ save: a.save, cancel: a.cancel, restore: a.restore, saving: a.saving }}
      />
    </form>
  );
}
