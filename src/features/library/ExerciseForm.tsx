"use client";
/**
 * «Nuovo esercizio» (V-07): its name, its movement (the guide gym mode
 * progresses it by), its equipment, how its sides work (target.md §7.4). Saved by
 * the action the page passes; errors in words; what was typed kept.
 */
import { useActionState } from "react";
import { Field, PageHeader } from "@lifeos/kit";
import { EQUIPMENT_WORDS, PATTERN_WORDS, SIDES_WORDS } from "@/i18n/training";

const options = (w: Record<string, string>) =>
  Object.entries(w).map(([value, label]) => ({ value, label }));

export type ExerciseFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};

export function ExerciseForm({
  action,
}: {
  action: (s: ExerciseFormState, d: FormData) => Promise<ExerciseFormState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: { sides: "both" },
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  return (
    <form key={state.n} action={submit} className="k-page">
      <PageHeader
        title="Nuovo esercizio"
        back={{ label: "Esercizi", href: "/corpo/elenco" }}
        of={{ fam: "train" }}
      />
      <section className="k-section g4" aria-label="Esercizio">
        <Field
          name="name"
          label="Nome"
          type="text"
          required
          placeholder="per esempio: Alzate laterali ai cavi"
          defaultValue={v["name"] ?? ""}
          error={e["name"]}
        />
        <Field
          name="pattern"
          label="Movimento"
          type="choice"
          defaultValue={v["pattern"] ?? ""}
          help="Decide serie, ripetizioni e recuperi proposti. Senza: ripete l’ultima volta."
          options={options(PATTERN_WORDS).filter((o) => o.value !== "other")}
        />
        <Field
          name="equipment"
          label="Attrezzo"
          type="choice"
          defaultValue={v["equipment"] ?? ""}
          help="Con i manubri il carico si scrive per manubrio."
          options={options(EQUIPMENT_WORDS)}
        />
        <Field
          name="sides"
          label="Lati"
          type="choice"
          required
          defaultValue={v["sides"] ?? "both"}
          options={options(SIDES_WORDS)}
        />
        {e["form"] && (
          <p className="k-help" role="alert">
            {e["form"]}
          </p>
        )}
      </section>
      <div className="k-pagefoot">
        <a className="k-btn secondary" href="/oggi/elenco">
          Annulla
        </a>
        <button type="submit" className="k-btn primary" aria-busy={pending}>
          Salva
        </button>
      </div>
    </form>
  );
}
