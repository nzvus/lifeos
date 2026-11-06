"use client";
/**
 * ObjectForm (PAT-61): the form of every type, generated from its fields (`form.ts`), with one
 * sticky «Salva». A type adds a custom section only through its specialisation (`children`).
 * Saving failed → `error` shows the Banner (PAT-72) and what was typed stays.
 */
import type { ReactNode } from "react";
import { Banner } from "./Banner";
import { Field } from "./Field";
import { formFields, type FormFieldSpec, type FormValue } from "./form";
import { WORDS } from "./words";

export function ObjectForm({
  fields,
  values = {},
  errors = {},
  action,
  submitLabel = WORDS.save,
  busy = false,
  error,
  onRetry,
  children,
}: {
  fields: readonly FormFieldSpec[];
  values?: Readonly<Record<string, FormValue>>;
  errors?: Readonly<Record<string, string>>;
  /** A server action, or a client function given the FormData. */
  action: (data: FormData) => void | Promise<void>;
  submitLabel?: string;
  busy?: boolean;
  error?: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <form action={action} className="k-stack g4 k-objform">
      {error && <Banner text={error} {...(onRetry ? { onRetry } : {})} />}
      {formFields(fields, values, errors).map((f) => (
        <Field key={f.name} {...f} />
      ))}
      {children}
      <div className="k-formfoot">
        <button
          type="submit"
          className="k-btn primary"
          disabled={busy}
          aria-busy={busy || undefined}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
