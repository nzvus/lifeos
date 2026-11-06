"use client";
/**
 * Composer (PAT-62, PAT-14): composing a thing with lines — the lines as boxes (its quantity as
 * a stepper in its unit, «Togli»), under them the search that adds an object (`Find`), as the
 * food composer has it, the totals as they change, and one sticky «Salva» at the bottom with
 * «Annulla» beside it. A plain form: the
 * caller's server action reads `line.N.key` / `line.N` (`readLines`) and rereads every object.
 * The kit knows no type: what a line shows, and the totals, come from the caller.
 */
import { useState, type ReactNode } from "react";
import { Box, type BoxEntry } from "./Box";
import { addLine, removeLine, setQuantity, type ComposerLineData } from "./composer";
import { Field } from "./Field";
import { Find, type FindItem } from "./Find";
import { WORDS } from "./words";

export type ComposerLine = ComposerLineData & {
  entry: BoxEntry;
  unit: string;
  step: number;
};

export function Composer<T extends FindItem>({
  initial = [],
  candidates,
  hour,
  findLabel,
  toLine,
  totals,
  empty,
  errors = {},
  saveLabel,
  cancelHref,
  action,
  busy = false,
  children,
}: {
  initial?: readonly ComposerLine[];
  candidates: readonly T[];
  hour: number;
  findLabel: string;
  /** An object picked in the search, as a line at its usual quantity. */
  toLine: (item: T) => ComposerLine;
  /** What the lines add up to, recomputed as they change. */
  totals?: (lines: readonly ComposerLine[]) => ReactNode;
  /** Said while there is no line («Cerca un cibo da aggiungere»). */
  empty: string;
  errors?: Readonly<Record<string, string>>;
  saveLabel: string;
  cancelHref: string;
  action: (data: FormData) => void | Promise<void>;
  busy?: boolean;
  /** The type's own fields (when, servings, a note), before the foot. */
  children?: ReactNode;
}) {
  const [lines, setLines] = useState<readonly ComposerLine[]>(initial);
  return (
    <form className="k-stack g3 k-composer" action={action}>
      {lines.length === 0 ? (
        <p className="k-meta">{empty}</p>
      ) : (
        <div className="k-stack g2">
          {lines.map((l, i) => (
            <Box
              key={l.key}
              density="row"
              rail={false}
              entry={l.entry}
              acts={[
                {
                  label: WORDS.composer.remove,
                  aria: WORDS.composer.remove + " " + l.entry.title,
                  onClick: () => setLines((ls) => removeLine(ls, l.key)),
                },
              ]}
            >
              <input type="hidden" name={`line.${i}.key`} value={l.key} />
              <Field
                name={`line.${i}`}
                label={WORDS.composer.quantity(l.entry.title)}
                hideLabel
                type="stepper"
                unit={l.unit}
                step={l.step}
                defaultValue={l.quantity}
                error={errors[`line.${i}`]}
                onChange={(q) => setLines((ls) => setQuantity(ls, l.key, q))}
              />
            </Box>
          ))}
        </div>
      )}
      <Find
        items={candidates.filter((c) => !lines.some((l) => l.key === c.id))}
        label={findLabel}
        hour={hour}
        onPick={(item) => setLines((ls) => addLine(ls, toLine(item)))}
      />
      {totals && lines.length > 0 && (
        <div className="k-composertotals">{totals(lines)}</div>
      )}
      {children}
      <div className="k-formfoot">
        <a className="k-btn secondary" href={cancelHref}>
          {WORDS.cancel}
        </a>
        <button
          type="submit"
          className="k-btn primary"
          disabled={busy || lines.length === 0}
          aria-busy={busy || undefined}
        >
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
