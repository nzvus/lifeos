"use client";
/**
 * A pasto's «Ingredienti» band in its Elenco box (his §169): each parent's foods first, in that
 * parent's shade of the kin colour, its multiplier before its name (MOD-23, PAT-103); then the
 * pasto's own foods, each changed in place on the right — − grams + and the trash (PAT-13). «+
 * Aggiungi» at the top turns the band into a search of the cibi, results under it; a pick adds
 * 100 g. A parent's foods are its own: they change with its multiplier, in the rows above.
 */
import { useState } from "react";
import { F, Find, Glyph, type FindItem } from "@lifeos/kit";
import type { VerbServer } from "@/features/objects/use-object-verbs";
import { food } from "@/i18n/food";
import type { LibraryRow, MealFood } from "./library";

const w = food.meal.ingredients;
const STEP = 10;
const ADDED = 100;

export function MealIngredients({
  id,
  ingredients,
  cibi,
  server,
}: {
  id: string;
  ingredients: NonNullable<NonNullable<LibraryRow["meal"]>["ingredients"]>;
  cibi: readonly FindItem[];
  server: NonNullable<VerbServer["kin"]>;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const set = (key: string, q: number | null) => void server.food(id, key, q);
  const amount = (f: MealFood) => F.num(f.quantity, f.unit);
  if (adding)
    return (
      <div className="k-stack g2 k-ingfind">
        <button type="button" className="k-btn act" onClick={() => setAdding(false)}>
          {w.close}
        </button>
        <Find
          items={cibi}
          label={w.find}
          hour={new Date().getHours()}
          autoFocus
          onPick={(x) => {
            setAdding(false);
            set(x.id, ADDED);
          }}
        />
      </div>
    );
  return (
    <div className="k-stack g1 k-ing">
      <button
        type="button"
        className="k-btn act k-ingadd"
        onClick={() => setAdding(true)}
      >
        <Glyph of={{ ui: "add" }} decorative />
        <span>{w.add}</span>
      </button>
      {ingredients.parents.map((p, i) => (
        <div
          key={p.id}
          className={"k-inggroup g" + (i % 3)}
          role="group"
          aria-label={p.name}
        >
          <div className="k-ingparent">
            <b className="k-num">{F.input(p.k, 2)}</b>
            <span className="k-clip">{p.name}</span>
          </div>
          {p.foods.map((f) => (
            <div key={f.key} className="k-ingrow from">
              <span className="k-clip">{f.name}</span>
              <span className="k-meta">{amount(f)}</span>
            </div>
          ))}
        </div>
      ))}
      {ingredients.own.map((f) =>
        // Shut, its name and its grams; a tap on the grams opens − grams + and the trash, as a
        // kin's multiplier does (his §160), so the name keeps its room (his §169).
        editing === f.key ? (
          <div key={f.key} className="k-ingrow editing">
            <span className="k-clip">{f.name}</span>
            <span className="k-line g1 k-step" role="group" aria-label={f.name}>
              <button
                type="button"
                className="k-btn act"
                aria-label={w.less(f.name)}
                onClick={() => {
                  if (f.quantity > STEP) set(f.key, f.quantity - STEP);
                }}
              >
                −
              </button>
              <button
                type="button"
                className="k-num k-ingq"
                aria-expanded
                aria-label={w.edit(f.name)}
                onClick={() => setEditing(null)}
              >
                {amount(f)}
              </button>
              <button
                type="button"
                className="k-btn act"
                aria-label={w.more(f.name)}
                onClick={() => set(f.key, f.quantity + STEP)}
              >
                +
              </button>
            </span>
            <button
              type="button"
              className="k-btn act icon danger"
              aria-label={w.remove(f.name)}
              onClick={() => {
                setEditing(null);
                set(f.key, null);
              }}
            >
              <Glyph of={{ ui: "delete" }} decorative />
            </button>
          </div>
        ) : (
          <div key={f.key} className="k-ingrow">
            <span className="k-clip">
              {f.name}
              {f.brand && <span className="k-meta"> · {f.brand}</span>}
            </span>
            <button
              type="button"
              className="k-num k-ingq"
              aria-expanded={false}
              aria-label={w.edit(f.name)}
              onClick={() => setEditing(f.key)}
            >
              {amount(f)}
            </button>
          </div>
        ),
      )}
    </div>
  );
}
