/**
 * ui/SelectField.tsx — a labelled <select> with optional error. Same contract
 * and accessibility wiring as ui/Field.tsx.
 */
import type { SelectHTMLAttributes, ReactNode } from "react";

type Option = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  /** Optional icon before the label (decorative: the label names the field). */
  icon?: ReactNode;
  name: string;
  options: readonly Option[];
  error?: string;
  /** Shown as a first, empty option ("Choose…") when given. */
  placeholder?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name">;

export function SelectField({
  label,
  icon,
  name,
  options,
  error,
  placeholder,
  id,
  className,
  ...select
}: SelectFieldProps) {
  const selectId = id ?? `field-${name}`;
  const errorId = error ? `${selectId}-error` : undefined;
  return (
    <div className={className ?? "flex flex-col gap-1"}>
      <label
        htmlFor={selectId}
        className="flex items-center gap-1.5 text-meta font-semibold"
      >
        {icon}
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className="w-full rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 text-body outline-none focus-visible:border-focus aria-invalid:border-tomato"
        {...select}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-meta font-semibold text-tomato">
          {error}
        </p>
      )}
    </div>
  );
}
