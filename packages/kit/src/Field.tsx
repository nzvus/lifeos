"use client";
/**
 * Field (kit.md §3): one input for every kind of field, the boards' markup
 * and classes. In the app each Field is a named form control, so a form
 * posts plain FormData: the stepper's value is a text input, a scale or a
 * choice keeps its pick in a hidden input. A choice with more than four
 * options, or labels too long for a phone, is a drop-down (shapes.md §4).
 * Tapping a chosen scale or choice again clears it, unless it is required.
 */
import { useState } from "react";
import { Recurrence } from "./Recurrence";
import { Stepper } from "./Stepper";

export { stepBy } from "./Stepper";

export type FieldOption = { value: string; label: string; sub?: string };

export type FieldProps = {
  name: string;
  label: string;
  /** The label is read by screen readers but not shown (a stepper inside a box that names it). */
  hideLabel?: boolean;
  type: "stepper" | "scale" | "choice" | "text" | "time" | "date" | "recurrence";
  /** For a recurrence: the day «dal giorno» and a new date start from (ISO). */
  today?: string;
  defaultValue?: string;
  unit?: string;
  step?: number;
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Replaces the help, in the alert colour. */
  error?: string | undefined;
  /** Told each new value, for a page that recomputes as it changes (the composer). */
  onChange?: (value: string) => void;
};

const asSelect = (opts: FieldOption[]) =>
  opts.length > 4 ||
  opts.some((o) => o.label.length > 16) ||
  opts.reduce((n, o) => n + o.label.length, 0) > 34;

export function Field(p: FieldProps) {
  const [v, setValue] = useState(p.defaultValue ?? "");
  const setV = (x: string) => {
    setValue(x);
    p.onChange?.(x);
  };
  const opts = p.options ?? [];
  const pick = (o: string) => setV(v === o && !p.required ? "" : o);
  const id = "f-" + p.name;
  const helpText = p.error ?? p.help;
  return (
    <div className={"k-field" + (p.error ? " error" : "")}>
      <div className={p.hideLabel ? "k-sr" : "lab"}>
        <label className="k-label" htmlFor={p.type === "scale" ? undefined : id}>
          {p.label}
        </label>
        {p.unit && p.type !== "stepper" && <span className="k-meta">{p.unit}</span>}
      </div>
      {p.type === "stepper" && (
        <Stepper
          id={id}
          name={p.name}
          label={p.label}
          value={v}
          onChange={setV}
          unit={p.unit}
          step={p.step}
          invalid={!!p.error}
        />
      )}
      {p.type === "recurrence" && (
        <Recurrence
          id={id}
          name={p.name}
          label={p.label}
          value={v}
          onChange={setV}
          today={p.today}
        />
      )}
      {p.type === "scale" && (
        <div
          className="k-scale"
          role="radiogroup"
          aria-label={p.label}
          style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))` }}
        >
          <input type="hidden" name={p.name} value={v} />
          {opts.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={v === o.value}
              aria-pressed={v === o.value}
              onClick={() => pick(o.value)}
            >
              <span>{o.label}</span>
              {o.sub && <small>{o.sub}</small>}
            </button>
          ))}
        </div>
      )}
      {p.type === "choice" &&
        (asSelect(opts) ? (
          <select
            id={id}
            name={p.name}
            className="k-select"
            value={v}
            onChange={(e) => setV(e.target.value)}
          >
            <option value="">–</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="k-choice" role="radiogroup" aria-label={p.label} id={id}>
            <input type="hidden" name={p.name} value={v} />
            {opts.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={v === o.value}
                onClick={() => pick(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        ))}
      {(p.type === "text" || p.type === "time" || p.type === "date") && (
        <input
          id={id}
          name={p.name}
          className="k-text"
          type={p.type === "text" ? "text" : p.type}
          value={v}
          placeholder={p.placeholder}
          onChange={(e) => setV(e.target.value)}
          aria-invalid={p.error ? true : undefined}
        />
      )}
      {helpText && (
        <span className="k-help" role={p.error ? "alert" : undefined}>
          {helpText}
        </span>
      )}
    </div>
  );
}
