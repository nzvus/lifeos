"use client";
/**
 * InPlace (PAT-13): a value that becomes editable where it is. At rest, one row — its label and
 * its value — that is the whole target; tapped, the kit's `Field` for its type. Leaving the field
 * (or Enter) saves through `onSave`, which answers an error to show or null; Esc puts it back.
 * No `/modifica` page. The caller shows the toast «Salvato · Annulla» (PAT-21).
 */
import { useEffect, useRef, useState } from "react";
import { Field } from "./Field";
import { formFields, type FormFieldSpec, type FormValue } from "./form";
import { inPlaceCommit } from "./inplace";

export function InPlace({
  spec,
  value,
  shown,
  onSave,
  initiallyEditing = false,
}: {
  spec: FormFieldSpec;
  value: FormValue;
  /** The value as the page shows it (through `F`), «—» when empty. */
  shown: string;
  onSave: (value: FormValue) => Promise<string | null>;
  /** Open from the start (the gallery's photos). */
  initiallyEditing?: boolean;
}) {
  const [editing, setEditing] = useState(initiallyEditing);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (editing && !initiallyEditing)
      form.current
        ?.querySelector<HTMLElement>("input:not([type=hidden]), select, button")
        ?.focus();
  }, [editing, initiallyEditing]);
  const close = () => {
    setEditing(false);
    setError(null);
  };
  const commit = async () => {
    if (!form.current || busy) return;
    const raw = String(new FormData(form.current).get(spec.key) ?? "");
    const c = inPlaceCommit(spec, raw, value);
    if (c.kind === "error") return setError(c.error);
    if (c.kind === "same") return close();
    setBusy(true);
    const refused = await onSave(c.value);
    setBusy(false);
    if (refused) setError(refused);
    else close();
  };
  if (!editing)
    return (
      <button type="button" className="k-inplace" onClick={() => setEditing(true)}>
        <span className="k-label">{spec.label}</span>
        <span className="k-body v">{shown || "—"}</span>
      </button>
    );
  const field = formFields(
    [spec],
    { [spec.key]: value },
    error ? { [spec.key]: error } : {},
  )[0]!;
  return (
    <form
      ref={form}
      className="k-inplace editing"
      aria-busy={busy}
      onSubmit={(e) => {
        e.preventDefault();
        void commit();
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) void commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <Field {...field} />
    </form>
  );
}
