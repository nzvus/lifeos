/**
 * ui/useAutoSave.ts — settings that save themselves (design review S3,
 * 2026-10-02; the convention of phone settings): a select, checkbox or
 * radio saves at once; a text field when you leave it, if it changed, so a
 * half-typed time zone is never sent. Spread the result on the <form>.
 */
"use client";

import type { FocusEvent, FormEvent } from "react";

// A time or date comes from a picker: on a phone the field never loses
// focus after it (the sleep form never saved, 2026-10-02), and its value is
// complete or empty, never half-typed. So they save at once too.
const AT_ONCE = new Set([
  "time",
  "checkbox",
  "radio",
  "select-one",
  "select-multiple",
  "date",
  "range",
]);

// "A text field changed" lives on the form element itself (data-dirty):
// no state to re-render, no ref read during render.
const handlers = {
  onChange: (e: FormEvent<HTMLFormElement>) => {
    const field = e.target as HTMLInputElement | HTMLSelectElement;
    if (AT_ONCE.has(field.type)) e.currentTarget.requestSubmit();
    else e.currentTarget.dataset.dirty = "1";
  },
  onBlur: (e: FocusEvent<HTMLFormElement>) => {
    if (e.currentTarget.dataset.dirty !== "1") return;
    delete e.currentTarget.dataset.dirty;
    e.currentTarget.requestSubmit();
  },
};

export function useAutoSave() {
  return handlers;
}
