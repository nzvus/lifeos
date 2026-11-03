"use client";
/**
 * «Nuova assunzione» (FOOD-44, ADR-0060): a name, what one dose weighs (and
 * how it is called: «capsula», «misurino»), and what one dose carries —
 * caffeine, creatine, kcal if any. The server turns them into values per 100.
 */
import { useActionState } from "react";
import { Field, PageHeader } from "@lifeos/kit";
import type { IntakeFormState } from "@/app/(app)/aggiungi/assunzione/actions";

export function IntakeForm({
  backHref,
  action,
}: {
  backHref: string;
  action: (s: IntakeFormState, d: FormData) => Promise<IntakeFormState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: {},
    n: 0,
  });
  const v = state.values;
  const e = state.errors;
  return (
    <form key={state.n} action={submit} className="k-page">
      <PageHeader
        title="Nuova assunzione"
        context="si segna con un tocco, senza comporre un pasto"
        back={{ label: "Assunzione", href: backHref }}
        of={{ fam: "drink", kind: "supplement" }}
      />
      <section className="k-section g3" aria-label="Cos'è">
        <Field
          name="name"
          label="Nome"
          type="text"
          required
          placeholder="per esempio: Magnesio"
          defaultValue={v["name"] ?? ""}
          error={e["name"]}
        />
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
        <Field
          name="dose"
          label="Una dose"
          type="stepper"
          step={0.5}
          required
          placeholder="per esempio 3"
          defaultValue={v["dose"] ?? ""}
          error={e["dose"]}
          help="Quanto pesa ciò che prendi ogni volta: una capsula di caffè ≈ 7 g."
        />
        <Field
          name="doseName"
          label="Come si chiama una dose"
          type="text"
          placeholder="facoltativo: capsula, misurino, compressa"
          defaultValue={v["doseName"] ?? ""}
        />
      </section>
      <section className="k-section g3" aria-label="Cosa contiene una dose">
        <h2>In una dose</h2>
        <Field
          name="caffeine"
          label="Caffeina"
          type="stepper"
          unit="mg"
          step={10}
          placeholder="–"
          defaultValue={v["caffeine"] ?? ""}
          error={e["caffeine"]}
          help="Un espresso ≈ 60–100 mg."
        />
        <Field
          name="creatine"
          label="Creatina"
          type="stepper"
          unit="g"
          step={0.5}
          placeholder="–"
          defaultValue={v["creatine"] ?? ""}
          error={e["creatine"]}
        />
        <Field
          name="kcal"
          label="Energia"
          type="stepper"
          unit="kcal"
          step={1}
          placeholder="0"
          defaultValue={v["kcal"] ?? ""}
          error={e["kcal"]}
          help="Sopra le 20 kcal ogni 100 è più un cibo: segnalo nei pasti."
        />
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
