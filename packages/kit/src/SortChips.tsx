"use client";
/** SortChips (PAT-42): a list's declared sort keys as one chip row, never a drop-down. */
import { WORDS } from "./words";

export function SortChips({
  keys,
  value,
  onChange,
}: {
  keys: readonly { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="k-chips" role="group" aria-label={WORDS.sortBy}>
      {keys.map((k) => (
        <button
          key={k.key}
          type="button"
          className={"k-chip" + (k.key === value ? " on" : "")}
          aria-pressed={k.key === value}
          onClick={() => onChange(k.key)}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
