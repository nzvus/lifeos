"use client";
/**
 * «Nuovo …» for a type with plain declared fields (PAT-11, PAT-61): its header, then the kit's
 * `ObjectForm` — the name and the type's fields as the registry declares them (`newFields`).
 * Saved by the action the page passes; a refusal comes back with what was typed and its words.
 */
import { useActionState } from "react";
import { ObjectForm, PageHeader, type FormFieldSpec, type FormValue } from "@lifeos/kit";

export type NewObjectState = {
  errors: Record<string, string>;
  values: Record<string, FormValue>;
  n: number;
};

export function NewObjectForm({
  title,
  back,
  fam,
  fields,
  initial = {},
  action,
}: {
  title: string;
  back: { label: string; href: string };
  fam: string;
  fields: readonly FormFieldSpec[];
  initial?: Record<string, FormValue>;
  action: (prev: NewObjectState, data: FormData) => Promise<NewObjectState>;
}) {
  const [state, submit, pending] = useActionState(action, {
    errors: {},
    values: initial,
    n: 0,
  });
  return (
    <main className="k-page">
      <PageHeader title={title} back={back} of={{ fam }} />
      <section className="k-section g3" aria-label={title}>
        <ObjectForm
          key={state.n}
          fields={fields}
          values={state.values}
          errors={state.errors}
          action={submit}
          busy={pending}
          {...(state.errors["form"] ? { error: state.errors["form"] } : {})}
        />
      </section>
    </main>
  );
}
