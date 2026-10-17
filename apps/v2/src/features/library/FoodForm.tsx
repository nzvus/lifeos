"use client";
/**
 * A food's editor (V-07): its name and values per 100, saved by the server
 * action the page passes. Errors in words by field; what was typed is kept.
 */
import { useActionState } from "react";
import { Field, PageHeader } from "@lifeos/kit";
import { FOOD_FIELDS } from "./library";

export type FoodFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};

export function FoodForm({
  initial,
  unit,
  backHref,
  action,
}: {
  initial: Record<string, string>;
  unit: string;
  backHref: string;
  action: (s: FoodFormState, d: FormData) => Promise<FoodFormState>;
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
        title="Modifica cibo"
        context={initial["name"] ?? ""}
        back={{ label: "Cibo", href: backHref }}
        of={{ fam: "food" }}
      />
      <section className="k-section g3" aria-label="Nome">
        <Field
          name="name"
          label="Nome"
          type="text"
          required
          defaultValue={v["name"] ?? ""}
          error={e["name"]}
        />
      </section>
      <section className="k-section g3" aria-label="Valori">
        <h2>Per 100 {unit}</h2>
        <p className="k-help">
          I pasti già registrati tengono i valori di allora; un valore cambiato qui
          diventa «modificato».
        </p>
        {FOOD_FIELDS.map(([f, words, u]) => (
          <Field
            key={f}
            name={f}
            label={words}
            type="text"
            unit={u}
            placeholder="vuoto"
            defaultValue={v[f] ?? ""}
            error={e[f]}
          />
        ))}
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
