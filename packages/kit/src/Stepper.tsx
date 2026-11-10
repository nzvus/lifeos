"use client";
/**
 * Stepper (PAT-61): a number with − / + either side, his decimal comma kept (`stepBy`). The
 * markup of `Field`'s stepper, shared with «Ogni quanto» (Recurrence). Controlled: the caller
 * holds the value.
 */
export type StepperProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string | undefined;
  step?: number | undefined;
  invalid?: boolean | undefined;
};

/** "75,6" + 0,5 → "76,1": the stepper keeps the person's decimal comma. */
export function stepBy(v: string, by: number): string {
  const x = Number(v.replace(",", ".") || "0");
  if (!Number.isFinite(x)) return v;
  const next = Math.max(0, Math.round((x + by) * 100) / 100);
  return String(next).replace(".", ",");
}

export function Stepper(p: StepperProps) {
  const step = p.step ?? 1;
  return (
    <div className="k-step">
      <button
        type="button"
        aria-label={p.label + ": meno " + step}
        onClick={() => p.onChange(stepBy(p.value, -step))}
      >
        −
      </button>
      <span className="v">
        <input
          id={p.id}
          name={p.name}
          className="k-stepin"
          inputMode="decimal"
          autoComplete="off"
          value={p.value}
          placeholder="–"
          onChange={(e) => p.onChange(e.target.value)}
          aria-invalid={p.invalid ? true : undefined}
        />
        {p.unit && <span className="u">{p.unit}</span>}
      </span>
      <button
        type="button"
        aria-label={p.label + ": più " + step}
        onClick={() => p.onChange(stepBy(p.value, step))}
      >
        +
      </button>
    </div>
  );
}
