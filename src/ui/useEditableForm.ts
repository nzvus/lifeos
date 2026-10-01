/**
 * ui/useEditableForm.ts — the ADR-0015 state of an edit form whose fields
 * start from text values (`initial`): what it holds now, whether that
 * differs from the saved version, the draft kept in this browser, and
 * `load(values)` to start the fields again from other values (↺ = the saved
 * version; or a restored draft) by remounting them (`version` is their key).
 *
 *   const f = useEditableForm(`exercise:${id}`, initial);
 *   <form ref={f.form}> <div key={f.version}> fields from f.base … </div>
 *   f.dirty, f.saved (the saved version as read), f.draft.found / clear
 */
"use client";

import { useRef, useState } from "react";
import { useDraft } from "./useDraft";
import { sameValues, useFormValues, type FormValues } from "./useFormValues";

export function useEditableForm(key: string, initial: FormValues) {
  const form = useRef<HTMLFormElement>(null);
  const [base, setBase] = useState<FormValues>(initial);
  const [version, setVersion] = useState(0);
  const values = useFormValues(form, version);
  // What is saved, as the form reads it on its first render.
  const [saved, setSaved] = useState<FormValues | null>(null);
  if (saved === null && values !== null && version === 0) setSaved(values);
  const dirty = saved !== null && values !== null && !sameValues(values, saved);
  const draft = useDraft(key, values ?? {}, dirty);
  const load = (v: FormValues) => {
    setBase(v);
    setVersion((n) => n + 1);
  };
  /** A draft from an earlier visit, still different from what is shown. */
  const offer = draft.found && !sameValues(draft.found, values) ? draft.found : null;
  return { form, base, version, values, saved, dirty, draft, offer, load };
}

/** Values as the FormData a server action reads (the previous version, for Undo). */
export function toFormData(v: FormValues): FormData {
  const fd = new FormData();
  for (const [k, x] of Object.entries(v)) fd.set(k, x);
  return fd;
}
