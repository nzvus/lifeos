/**
 * ui/FoodDetails.tsx — THE "details" disclosure of a food: what it is made
 * of, line by line (name, amount eaten, and its macro strip when there is
 * more than one line — a single ingredient's strip would repeat the row's),
 * then whatever the caller adds (time editor, actions). Native <details>, no
 * JavaScript. Used by the day's entries and the meals list; it sits above
 * the cover of a row that opens on tap (ui/ListItem), so it still expands.
 */
import type { ReactNode } from "react";
import { MacroStrip, type MacroStripLabels, type MacroStripValues } from "./MacroStrip";

export type FoodDetailsLine = { name: string; amount: string; values: MacroStripValues };

export function FoodDetails({
  summary,
  lines,
  labels,
  children,
}: {
  summary: string;
  lines: readonly FoodDetailsLine[];
  labels: MacroStripLabels;
  children?: ReactNode;
}) {
  const withStrips = lines.length > 1;
  return (
    <details className="relative z-2 text-meta">
      <summary className="cursor-pointer text-muted">{summary}</summary>
      {/* Indented under a hairline: clearly part of the row above. */}
      <div className="mt-1 ml-2 flex flex-col gap-3 border-l border-hairline pl-3">
        <ul className={`flex flex-col ${withStrips ? "gap-2" : "gap-0.5"}`}>
          {lines.map((l, i) => (
            <li key={i} className="flex flex-col gap-0.5">
              <span>
                {l.name}
                <span className="pl-2 font-display text-muted tabular-nums">
                  {l.amount}
                </span>
              </span>
              {withStrips && <MacroStrip values={l.values} labels={labels} />}
            </li>
          ))}
        </ul>
        {children}
      </div>
    </details>
  );
}
