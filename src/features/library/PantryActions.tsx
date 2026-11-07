"use client";
/**
 * A food's «Comprato» and «Ne ho…» (dossiers/pantry.md §6; change 2026-11-07-food-meal): each a
 * button that opens its form in a sheet (PAT-14 one form per verb, PAT-61 `ObjectForm`), so the
 * food's page keeps ⊕ and no sticky «Salva» of its own (PAT-01). A refused value comes back
 * with the sheet open on it.
 */
import { useState } from "react";
import { ObjectForm, Sheet, type FormFieldSpec, type FormValue } from "@lifeos/kit";

export type PantryForm = {
  label: string;
  title: string;
  submit: string;
  fields: readonly FormFieldSpec[];
  values?: Readonly<Record<string, FormValue>>;
  action: (data: FormData) => void | Promise<void>;
};

export function PantryActions({
  forms,
  errors,
}: {
  forms: readonly PantryForm[];
  errors: Readonly<Record<string, string>>;
}) {
  const refused = forms.findIndex((f) => f.fields.some((x) => errors[x.key]));
  const [open, setOpen] = useState<number | null>(refused >= 0 ? refused : null);
  const f = open === null ? null : forms[open];
  return (
    <div className="k-line g2 wrap">
      {forms.map((x, i) => (
        <button
          key={x.label}
          type="button"
          className="k-btn act"
          onClick={() => setOpen(i)}
        >
          {x.label}
        </button>
      ))}
      <Sheet open={f !== null} title={f?.title ?? ""} onClose={() => setOpen(null)}>
        {f && (
          <ObjectForm
            fields={f.fields}
            values={f.values ?? {}}
            errors={errors}
            submitLabel={f.submit}
            action={f.action}
          />
        )}
      </Sheet>
    </div>
  );
}
