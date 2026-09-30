/**
 * ui/StarRating.tsx — 1–5 stars (ADR-0012 ratings). Two forms:
 *   - display: filled stars for a score (rounded), with the number;
 *   - input: a radio group (arrow keys work, like any radio group), one
 *     star per value, plus "no score". Controlled by the caller.
 */
"use client";

import { Star } from "lucide-react";

export function Stars({ score, label }: { score: number; label: string }) {
  const full = Math.round(score);
  return (
    <span
      className="inline-flex items-center gap-0.5 text-warn"
      role="img"
      aria-label={label}
      title={label}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          aria-hidden="true"
          className={n <= full ? "fill-current" : "opacity-40"}
        />
      ))}
    </span>
  );
}

export function StarInput({
  name,
  label,
  value,
  onChange,
  labels,
}: {
  /** Radio group name (unique per factor). */
  name: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  labels: { score: (n: number) => string; none: string };
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <legend className="float-left pr-2 text-meta font-semibold">{label}</legend>
      <span className="inline-flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer p-0.5 text-warn"
            title={labels.score(n)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <Star
              size={22}
              aria-hidden="true"
              className={value !== null && n <= value ? "fill-current" : "opacity-40"}
            />
            <span className="sr-only">{labels.score(n)}</span>
          </label>
        ))}
      </span>
      <label className="flex items-center gap-1 text-meta text-muted">
        <input
          type="radio"
          name={name}
          checked={value === null}
          onChange={() => onChange(null)}
        />
        {labels.none}
      </label>
    </fieldset>
  );
}
