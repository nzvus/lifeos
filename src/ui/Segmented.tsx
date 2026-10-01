/**
 * ui/Segmented.tsx — one choice among 2–4, as equal tiles in a row
 * (aria-pressed buttons): "Eaten | Planned", "Start now | Plan | Done",
 * intensity. Wider than a checkbox and easy to hit with a thumb; the
 * choice travels in the parent's hidden input.
 */
import type { ReactNode } from "react";

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string; icon?: ReactNode }[];
}) {
  const cols = ["", "", "grid-cols-2", "grid-cols-3", "grid-cols-4"][options.length];
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="pb-1 text-meta font-semibold">{label}</legend>
      <div className={`grid ${cols} gap-2`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`tile flex h-11 items-center justify-center gap-1.5 rounded-control px-2 font-display text-item ${
              value === o.value ? "border-ink font-bold" : "text-muted"
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
