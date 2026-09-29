/**
 * ui/Field.tsx — a labelled text/number input with optional hint and error.
 *
 * Why in ui/ (ADR-0002 rule of three): every form in the app (sign-in,
 * sign-up, ingredient, meal, log, settings) needs exactly this, so it had
 * more than three genuine occurrences on the day it was written.
 *
 * Presentation only: it receives already-translated strings. It knows
 * nothing about nutrients, owners or error codes.
 *
 * Accessibility: the <label> is tied to the input (htmlFor/id), and the hint
 * and error are linked with aria-describedby so screen readers announce them;
 * aria-invalid marks the field as wrong.
 */
import type { InputHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name">;

export function Field({ label, name, error, hint, id, className, ...input }: FieldProps) {
  const inputId = id ?? `field-${name}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={className ?? "flex flex-col gap-1"}>
      <label htmlFor={inputId} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className="w-full border-b-2 border-ink bg-sheet px-2 py-2 font-display text-lg tabular-nums outline-none focus-visible:border-focus aria-invalid:border-tomato"
        {...input}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-semibold text-tomato">
          {error}
        </p>
      )}
    </div>
  );
}
