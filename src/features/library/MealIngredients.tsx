"use client";
/**
 * A pasto's «Ingredienti» band in its Elenco box (his §169, §172): the kit's `IngredientTable` —
 * each food once, its name's background shared out among the parents it comes from in exact
 * proportion (each parent's foods × its multiplier, MOD-23), the rest its own; its amount typed in
 * place (a total: the pasto's own part is what is left once its parents' is taken out, never
 * below it); a row swiped left takes its own part out. The first row turns the band into a search
 * of the cibi; a pick adds 100 g.
 */
import { useState } from "react";
import { F, Find, IngredientTable, type FindItem, type IngredientRow } from "@lifeos/kit";
import type { VerbServer } from "@/features/objects/use-object-verbs";
import { food } from "@/i18n/food";
import type { LibraryRow, MealFood } from "./library";

const w = food.meal.ingredients;
const ADDED = 100;

type Groups = NonNullable<NonNullable<LibraryRow["meal"]>["ingredients"]>;
type Line = { f: MealFood; parents: { tone: number; q: number }[]; own: number };

/** Each food once: what each parent brings (by its tone) and what is its own. Pure. */
export function ingredientLines(g: Groups): Line[] {
  const by = new Map<string, Line>();
  const line = (f: MealFood) => {
    const l = by.get(f.key) ?? { f, parents: [], own: 0 };
    by.set(f.key, l);
    return l;
  };
  g.parents.forEach((p, tone) => {
    for (const f of p.foods) line(f).parents.push({ tone, q: f.quantity });
  });
  for (const f of g.own) line(f).own += f.quantity;
  return [...by.values()];
}

export function MealIngredients({
  id,
  ingredients,
  cibi,
  server,
}: {
  id: string;
  ingredients: Groups;
  cibi: readonly FindItem[];
  server: NonNullable<VerbServer["kin"]>;
}) {
  const [adding, setAdding] = useState(false);
  const lines = ingredientLines(ingredients);
  const from = (l: Line) => l.parents.reduce((a, p) => a + p.q, 0);
  const rows: IngredientRow[] = lines.map((l) => {
    const total = from(l) + l.own;
    return {
      key: l.f.key,
      name: l.f.name,
      ...(l.f.brand ? { meta: l.f.brand } : {}),
      amount: F.num(total, l.f.unit),
      value: +total.toFixed(1),
      unit: l.f.unit,
      shares: l.parents.map((p) => ({
        tone: p.tone,
        w: total > 0 ? (p.q / total) * 100 : 0,
      })),
      editable: true,
    };
  });
  const byKey = new Map(lines.map((l) => [l.f.key, l]));
  if (adding)
    return (
      <div className="k-stack g2 k-ingfind">
        <button type="button" className="k-irow k-iadd" onClick={() => setAdding(false)}>
          {w.close}
        </button>
        <Find
          items={cibi}
          label={w.find}
          hour={new Date().getHours()}
          autoFocus
          onPick={(x) => {
            setAdding(false);
            void server.food(id, x.id, ADDED);
          }}
        />
      </div>
    );
  return (
    <IngredientTable
      rows={rows}
      words={{ add: w.add, edit: w.edit, remove: w.swipe }}
      onAdd={() => setAdding(true)}
      onSet={(key, total) => {
        const l = byKey.get(key);
        if (!l) return;
        // the pasto's own part is the rest; never below what its parents bring
        const own = total - from(l);
        if (own < -0.05) return;
        void server.food(id, key, own > 0.05 ? +own.toFixed(1) : null);
      }}
      onRemove={(key) => {
        if ((byKey.get(key)?.own ?? 0) > 0) void server.food(id, key, null);
      }}
    />
  );
}
