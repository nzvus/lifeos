"use client";
/**
 * A saved meal's editor (V-07): its name, each food's quantity, ✕ to take
 * one out; «Archivia» takes it out of the lists. Saved by the actions the
 * page passes; errors in words, what was typed kept.
 */
import { useActionState, useState } from "react";
import { Field, PageHeader } from "@lifeos/kit";

export type RecipeFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};
export type RecipePart = {
  position: number;
  name: string;
  quantity: string;
  unit: string;
};

export function RecipeForm({
  name,
  parts,
  backHref,
  action,
  archive,
}: {
  name: string;
  parts: RecipePart[];
  backHref: string;
  action: (s: RecipeFormState, d: FormData) => Promise<RecipeFormState>;
  archive: () => Promise<void>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: {
      name,
      kept: parts.map((p) => p.position).join(","),
      ...Object.fromEntries(parts.map((p) => ["q." + p.position, p.quantity])),
    },
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  const [kept, setKept] = useState<number[]>(
    (v["kept"] ?? "").split(",").filter(Boolean).map(Number),
  );
  return (
    <form key={state.n} action={submit} className="k-page">
      <PageHeader
        title="Modifica pasto salvato"
        context={name}
        back={{ label: "Pasto", href: backHref }}
        of={{ fam: "food", kind: "meal" }}
      />
      <input type="hidden" name="kept" value={kept.join(",")} />
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
      <section className="k-section g3" aria-label="Cibi">
        <h2>Cibi, per una porzione</h2>
        {parts
          .filter((p) => kept.includes(p.position))
          .map((p) => (
            <div key={p.position} className="k-cline">
              <Field
                name={"q." + p.position}
                label={p.name}
                type="stepper"
                unit={p.unit}
                step={p.unit === "ml" ? 50 : 10}
                defaultValue={v["q." + p.position] ?? ""}
                error={e["q." + p.position]}
              />
              <button
                type="button"
                className="k-btn icon"
                aria-label={"Togli " + p.name}
                onClick={() => setKept(kept.filter((x) => x !== p.position))}
              >
                ✕
              </button>
            </div>
          ))}
        {e["form"] && (
          <p className="k-help" role="alert">
            {e["form"]}
          </p>
        )}
      </section>
      <section className="k-section g3" aria-label="Archivia">
        <p className="k-help">
          Archiviato, non compare più nella Libreria né nel composer; i pasti registrati
          restano.
        </p>
        <button
          type="submit"
          className="k-btn secondary"
          formAction={archive}
          formNoValidate
        >
          Archivia
        </button>
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
