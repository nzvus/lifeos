/**
 * ui/MuscleGroupPicker.tsx — muscle groups as chips grouped by body
 * region, tapped in order (the first is the main one), in the regions'
 * colours (ui/MuscleChip). The groups and labels come from the caller
 * (ui/ may not import core's anatomy lists). Used by the exercise editor
 * and by estimated sessions (ADR-0016).
 */
"use client";

import { MuscleChip } from "./MuscleChip";

export type RegionGroups = {
  region: string;
  label: string;
  groups: { key: string; label: string }[];
};

export function MuscleGroupPicker({
  regions,
  value,
  onChange,
  primaryLabel,
}: {
  regions: readonly RegionGroups[];
  value: readonly string[];
  onChange: (groups: string[]) => void;
  primaryLabel: string;
}) {
  const toggle = (g: string) =>
    onChange(value.includes(g) ? value.filter((x) => x !== g) : [...value, g]);
  return (
    <div className="flex flex-col gap-2">
      {regions.map((r) => (
        <div key={r.region} className="flex flex-col gap-1">
          <span className="text-meta text-muted">{r.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {r.groups.map((g) => {
              const at = value.indexOf(g.key);
              return (
                <button
                  key={g.key}
                  type="button"
                  aria-pressed={at >= 0}
                  onClick={() => toggle(g.key)}
                  className={`inline-flex items-center gap-1 rounded-control border px-2 py-1 ${
                    at >= 0
                      ? "border-ink bg-sheet"
                      : "border-hairline opacity-60 hover:opacity-100"
                  }`}
                >
                  <MuscleChip label={g.label} region={r.region} main={at === 0} />
                  {at === 0 && (
                    <span className="text-meta text-muted">{primaryLabel}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
