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

export type FieldOption = { value: string; label: string; sub?: string };

export type FieldProps = {
  name: string;
  label: string;
  type: "stepper" | "scale" | "choice" | "text" | "time";
  defaultValue?: string;
  unit?: string;
  step?: number;
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Replaces the help, in the alert colour. */
  error?: string | undefined;
};

const asSelect = (opts: FieldOption[]) =>
  opts.length > 4 ||
  opts.some((o) => o.label.length > 16) ||
  opts.reduce((n, o) => n + o.label.length, 0) > 34;

/** "75,6" + 0,5 → "76,1": the stepper keeps the person's decimal comma. */
export function stepBy(v: string, by: number): string {
  const x = Number(v.replace(",", ".") || "0");
  if (!Number.isFinite(x)) return v;
  const next = Math.max(0, Math.round((x + by) * 100) / 100);
  return String(next).replace(".", ",");
}

export function Field(p: FieldProps) {
  const [v, setV] = useState(p.defaultValue ?? "");
  const opts = p.options ?? [];
  const pick = (o: string) => setV(v === o && !p.required ? "" : o);
  const id = "f-" + p.name;
  const helpText = p.error ?? p.help;
  return (
    <div className={"k-field" + (p.error ? " error" : "")}>
      <div className="lab">
        <label className="k-label" htmlFor={p.type === "scale" ? undefined : id}>
          {p.label}
        </label>
        {p.unit && p.type !== "stepper" && <span className="k-meta">{p.unit}</span>}
      </div>
      {p.type === "stepper" && (
        <div className="k-step">
          <button
            type="button"
            aria-label={p.label + ": meno " + (p.step ?? 1)}
            onClick={() => setV(stepBy(v, -(p.step ?? 1)))}
          >
            −
          </button>
          <span className="v">
            <input
              id={id}
              name={p.name}
              className="k-stepin"
              inputMode="decimal"
              autoComplete="off"
              value={v}
              placeholder="–"
              onChange={(e) => setV(e.target.value)}
              aria-invalid={p.error ? true : undefined}
            />
            {p.unit && <span className="u">{p.unit}</span>}
          </span>
          <button
            type="button"
            aria-label={p.label + ": più " + (p.step ?? 1)}
            onClick={() => setV(stepBy(v, p.step ?? 1))}
          >
            +
          </button>
        </div>
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
      {(p.type === "text" || p.type === "time") && (
        <input
          id={id}
          name={p.name}
          className="k-text"
          type={p.type === "time" ? "time" : "text"}
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
