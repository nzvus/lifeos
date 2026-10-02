/**
 * ui/TimeField.tsx — a time of day, always on 24 hours (developer's request,
 * 2026-10-02). <input type="time"> shows AM/PM when the phone or the
 * browser is set to English, and no attribute changes that; two selects
 * (00–23, 00–59) do not depend on it.
 *
 * The value travels as "HH:MM" (or "" when empty and not required) in a
 * hidden input named `name`, so server actions read it exactly as before.
 * The hidden input is updated before the select's change reaches the form,
 * so ui/useAutoSave (selects save at once) submits the new time.
 * Controlled (`value` + `onChange`) or not (`defaultValue`), like an input.
 * The selects themselves are uncontrolled and keyed on the time: React
 * resets a form after its action, and a controlled select would fall back
 * to "--" on screen while keeping the saved time (seen 2026-10-02).
 */
"use client";

import { useRef, useState, type ReactNode } from "react";

type Props = {
  label: string;
  icon?: ReactNode;
  name: string;
  id?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));
const SELECT =
  "rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 font-display text-item text-ink tabular-nums outline-none focus-visible:border-focus aria-invalid:border-tomato";

export function TimeField(props: Props) {
  // Uncontrolled: a new default (React resets a form after an action) is a
  // fresh field, as in ui/SelectField.
  return props.value === undefined ? (
    <Inner key={props.defaultValue ?? ""} {...props} />
  ) : (
    <Inner {...props} />
  );
}

function Inner({
  label,
  icon,
  name,
  id,
  defaultValue,
  value,
  onChange,
  error,
  required,
  className,
}: Props) {
  const [own, setOwn] = useState(defaultValue ?? "");
  const current = value ?? own;
  const [h = "", m = ""] = current ? current.split(":") : [];
  const hidden = useRef<HTMLInputElement>(null);
  const fieldId = id ?? `field-${name}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  const set = (hour: string, minute: string) => {
    const next = hour ? `${hour}:${minute || "00"}` : "";
    if (hidden.current) hidden.current.value = next; // before the form hears it
    setOwn(next);
    onChange?.(next);
  };
  const common = {
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": errorId,
    className: SELECT,
  };

  return (
    <div className={className ?? "flex flex-col gap-1"}>
      <label
        htmlFor={fieldId}
        className="flex items-center gap-1.5 text-meta font-semibold"
      >
        {icon}
        {label}
      </label>
      <div className="flex items-center gap-1">
        <select
          key={`h${current}`}
          id={fieldId}
          defaultValue={h}
          onChange={(e) => set(e.target.value, m)}
          {...common}
        >
          {!required && <option value="">{"--"}</option>}
          {HOURS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="font-display text-item font-semibold">
          {":"}
        </span>
        <select
          key={`m${current}`}
          aria-label={label}
          defaultValue={h ? m : ""}
          onChange={(e) => set(h || "00", e.target.value)}
          {...common}
        >
          {(!required || !h) && <option value="">{"--"}</option>}
          {MINUTES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>
      <input ref={hidden} type="hidden" name={name} value={current} readOnly />
      {error && (
        <p id={errorId} className="text-meta font-semibold text-tomato">
          {error}
        </p>
      )}
    </div>
  );
}
