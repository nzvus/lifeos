/**
 * ui/StatTiles.tsx — a row of numbers, each in its own tile: the value
 * large and centred, its label under it, an optional note (a comparison)
 * below. The widget convention of S07: numbers centred in tiles, tiles
 * sharing the full width (2 per row on a phone, all in one row from sm).
 * Presentation only: values arrive formatted and translated.
 */
import type { ReactNode } from "react";

export type Stat = { value: ReactNode; label: string; note?: ReactNode };

export function StatTiles({ stats }: { stats: readonly Stat[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 @lg:grid-flow-col @lg:grid-cols-none @lg:auto-cols-fr">
      {stats.map((s) => (
        <li
          key={s.label}
          className="tile flex flex-col items-center justify-center gap-0.5 px-2 py-3 text-center"
        >
          <span className="font-display text-title leading-none font-bold tabular-nums">
            {s.value}
          </span>
          <span className="text-meta text-muted">{s.label}</span>
          {s.note && <span className="text-meta tabular-nums">{s.note}</span>}
        </li>
      ))}
    </ul>
  );
}
