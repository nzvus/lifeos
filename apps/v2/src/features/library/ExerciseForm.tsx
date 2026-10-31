"use client";
/**
 * «Nuovo esercizio» (V-07): its name, its movement (the guide gym mode
 * progresses it by), its equipment, one side at a time or not. Saved by
 * the action the page passes; errors in words; what was typed kept.
 */
import { useActionState } from "react";
import { Field, PageHeader } from "@lifeos/kit";

export type ExerciseFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};

export const MOVEMENTS: [string, string][] = [
  ["horizontal_press", "Spinta orizzontale (panca, chest press)"],
  ["vertical_press", "Spinta verticale (lento avanti)"],
  ["horizontal_pull", "Tirata orizzontale (rematore, pulley)"],
  ["vertical_pull", "Tirata verticale (lat machine, trazioni)"],
  ["squat", "Squat"],
  ["leg_press", "Leg press"],
  ["lunge", "Affondi"],
  ["hinge", "Stacchi, hip thrust"],
  ["fly", "Croci"],
  ["rear_fly", "Croci inverse"],
  ["lateral_raise", "Alzate laterali"],
  ["curl", "Curl bicipiti"],
  ["triceps_extension", "Tricipiti"],
  ["leg_curl", "Leg curl"],
  ["leg_extension", "Leg extension"],
  ["calf_raise", "Polpacci"],
  ["crunch", "Crunch, addominali"],
  ["leg_raise", "Sollevamento gambe"],
  ["plank", "Plank (a tempo)"],
  ["run", "Corsa (a tempo)"],
  ["bike", "Bici (a tempo)"],
];
export const EQUIPMENT_WORDS: [string, string][] = [
  ["barbell", "Bilanciere"],
  ["dumbbell", "Manubri"],
  ["cable", "Cavi"],
  ["machine", "Macchina"],
  ["bodyweight", "Corpo libero"],
];

export function ExerciseForm({
  action,
}: {
  action: (s: ExerciseFormState, d: FormData) => Promise<ExerciseFormState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: { unilateral: "no" },
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  return (
    <form key={state.n} action={submit} className="k-page">
      <PageHeader
        title="Nuovo esercizio"
        back={{ label: "Esercizi", href: "/oggi/elenco?vista=esercizi" }}
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
          options={MOVEMENTS.map(([value, label]) => ({ value, label }))}
        />
        <Field
          name="equipment"
          label="Attrezzo"
          type="choice"
          defaultValue={v["equipment"] ?? ""}
          help="Con i manubri il carico si scrive per manubrio."
          options={EQUIPMENT_WORDS.map(([value, label]) => ({ value, label }))}
        />
        <Field
          name="unilateral"
          label="Un lato alla volta"
          type="choice"
          required
          defaultValue={v["unilateral"] ?? "no"}
          options={[
            { value: "no", label: "No" },
            { value: "yes", label: "Sì" },
          ]}
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
