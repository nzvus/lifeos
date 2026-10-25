"use client";
/**
 * A food's editor (V-07; the board IngredientEditor): «Nome e codici» (the
 * name, the unit of a new food), «Per 100 g» (each value a stepper, two by
 * two; NOVA from 1 to 4), saved by the server action the page passes.
 * Errors in words by field; what was typed is kept.
 */
import { useActionState, type ReactNode } from "react";
import { Field, Glyph, PageHeader } from "@lifeos/kit";
import { FOOD_FIELDS } from "./library";

/** How much a stepper's − and + move each value (kcal by 10, salt by a tenth). */
const STEP: Record<string, number> = {
  kcal: 10,
  salt: 0.1,
  saturatedFat: 0.5,
  sugars: 0.5,
};

export type FoodFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};

export function FoodForm({
  initial,
  unit,
  isNew = false,
  productOf,
  backHref,
  action,
  top,
}: {
  initial: Record<string, string>;
  unit: string;
  /** A new food: its unit is chosen here. */
  isNew?: boolean;
  /** A new product of this food (its name): a brand, and only the label's values. */
  productOf?: string;
  backHref: string;
  action: (s: FoodFormState, d: FormData) => Promise<FoodFormState>;
  /** Drawn under the header (a new food's barcode box). */
  top?: ReactNode;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: initial,
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  return (
    <form key={state.n} action={submit} className="k-page">
      <PageHeader
        title={productOf ? "Nuovo prodotto" : isNew ? "Nuovo cibo" : "Modifica cibo"}
        context={productOf ?? initial["name"] ?? ""}
        back={{
          label:
            !isNew || productOf
              ? "Cibo"
              : backHref.startsWith("/aggiungi")
                ? "Pasto"
                : "Libreria",
          href: backHref,
        }}
        of={{ fam: "food" }}
      />
      {top}
      {v["barcode"] && <input type="hidden" name="barcode" value={v["barcode"]} />}
      <section className="k-section g3" aria-label="Nome">
        <h2>
          <span className="k-hicon">
            <Glyph of={{ section: "identity" }} size="m" />
          </span>
          {productOf ? "Marca" : "Nome e codici"}
        </h2>
        <Field
          name="name"
          label={productOf ? "Marca" : "Nome"}
          type="text"
          required
          {...(productOf ? { placeholder: "per esempio: Lidl" } : {})}
          defaultValue={v["name"] ?? ""}
          error={e["name"]}
        />
        {isNew && !productOf && (
          <Field
            name="unit"
            label="Si misura in"
            type="choice"
            required
            defaultValue={v["unit"] ?? "g"}
            options={[
              { value: "g", label: "grammi" },
              { value: "ml", label: "millilitri" },
            ]}
          />
        )}
      </section>
      <section className="k-section g3" aria-label="Valori">
        <h2>
          <span className="k-hicon">
            <Glyph of={{ section: "values" }} size="m" />
          </span>
          {isNew && !productOf ? "Per 100 g o ml" : "Per 100 " + unit}
        </h2>
        <p className="k-help">
          {productOf
            ? "Dall’etichetta, solo quelli diversi: i vuoti restano quelli del cibo."
            : isNew
              ? "Dall’etichetta; quello che non sai lascialo vuoto."
              : "I pasti già registrati tengono i valori di allora; un valore cambiato qui diventa «modificato»."}
        </p>
        <div className="k-grid">
          {FOOD_FIELDS.filter(([f]) => f !== "nova").map(([f, words, u]) => (
            <Field
              key={f}
              name={f}
              label={words}
              type="stepper"
              unit={u}
              step={STEP[f] ?? 1}
              placeholder="–"
              defaultValue={v[f] ?? ""}
              error={e[f]}
            />
          ))}
        </div>
        <Field
          name="nova"
          label="NOVA (quanto è trasformato)"
          type="choice"
          defaultValue={v["nova"] ?? ""}
          options={["1", "2", "3", "4"].map((n) => ({ value: n, label: n }))}
          help="1 non trasformato · 4 ultra-trasformato. Mostrato, non contato nel voto."
          error={e["nova"]}
        />
        {e["form"] && (
          <p className="k-help" role="alert">
            {e["form"]}
          </p>
        )}
      </section>
      <div className="k-pagefoot">
        <a className="k-btn secondary" href={backHref}>
          Annulla
        </a>
        <button type="submit" className="k-btn primary" aria-busy={pending}>
          Salva
        </button>
      </div>
    </form>
  );
}
