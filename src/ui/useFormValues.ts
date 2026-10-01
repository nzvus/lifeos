/**
 * ui/useFormValues.ts — the current fields of an uncontrolled <form>, as
 * text (FormData), kept up to date after every input, change or click
 * inside it (clicks: chips and buttons that change hidden fields). Lets a
 * form with many defaultValue fields know when it differs from what is
 * saved (ADR-0015) without making every field controlled.
 *
 * `version` restarts the reading after the form is remounted (↺ restore,
 * a draft brought back).
 */
"use client";

import { useEffect, useState, type RefObject } from "react";

export type FormValues = Record<string, string>;

export function readForm(form: HTMLFormElement): FormValues {
  const out: FormValues = {};
  for (const [k, v] of new FormData(form).entries())
    if (typeof v === "string") out[k] = k in out ? `${out[k]},${v}` : v;
  return out;
}

/** The same values always serialise the same way (keys sorted). */
export const sameValues = (a: FormValues | null, b: FormValues | null) =>
  JSON.stringify(Object.entries(a ?? {}).sort()) ===
  JSON.stringify(Object.entries(b ?? {}).sort());

export function useFormValues(form: RefObject<HTMLFormElement | null>, version: number) {
  const [values, setValues] = useState<FormValues | null>(null);
  useEffect(() => {
    const el = form.current;
    if (!el) return;
    let frame = 0;
    // After React has applied the change (hidden fields, controlled inputs).
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setValues(readForm(el)));
    };
    read();
    el.addEventListener("input", read);
    el.addEventListener("change", read);
    el.addEventListener("click", read);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("input", read);
      el.removeEventListener("change", read);
      el.removeEventListener("click", read);
    };
  }, [form, version]);
  return values;
}
