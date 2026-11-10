"use client";
/**
 * Composer (PAT-62, PAT-14): composing a thing with lines — the lines as boxes (its quantity as
 * a stepper in its unit, «Togli»), under them the search that adds an object (`Find`), the
 * totals as they change, the type's own fields, and one sticky foot: «Annulla» + «Salva».
 * A plain form: the caller's server action reads `line.N.key` / `line.N` (`readLines`) and
 * rereads every object. The kit knows no type: what a line shows, and the totals, come from
 * the caller.
 *
 * Its lines are its own, or the caller's (`lines` + `onLines`) when something outside the list
 * changes them too (a food composer's «Porta … a …», a saved meal that adds several). A type
 * with a richer search (filters, a scanner, «Crea …») passes its `Find` as `search`. A type
 * whose lines have no quantity (a scheda's exercises, `counted={false}`) gets no stepper but
 * «Su» / «Giù»: its order is what it posts (`readOrder`).
 */
import { useState, type ReactNode } from "react";
import { Box, type BoxEntry } from "./Box";
import {
  addLine,
  moveLine,
  removeLine,
  setQuantity,
  type ComposerLineData,
} from "./composer";
import { Field } from "./Field";
import { Find, type FindItem } from "./Find";
import { WORDS } from "./words";

export type ComposerLine = ComposerLineData & {
  entry: BoxEntry;
  unit: string;
  step: number;
  /** Under its stepper, inside its box (a food's brand). */
  below?: ReactNode;
  /** No stepper: its quantity posts as it is (a blocco's type has none to change). */
  fixed?: boolean;
};

export function Composer<T extends FindItem>({
  initial = [],
  lines: given,
  onLines,
  stamp = 0,
  counted = true,
  candidates = [],
  hour = 12,
  findLabel = "",
  toLine,
  search,
  head,
  title,
  totals,
  empty,
  errors = {},
  saveLabel,
  canSave,
  cancelHref,
  action,
  busy = false,
  children,
}: {
  initial?: readonly ComposerLine[];
  /** The caller's lines (with `onLines`): the composer draws them and reports each change. */
  lines?: readonly ComposerLine[];
  onLines?: (lines: ComposerLine[]) => void;
  /** Changed by the caller when it sets a quantity itself: the steppers start again from it. */
  stamp?: number;
  /** Lines with a quantity (a stepper each); false: an ordered list, moved up and down. */
  counted?: boolean;
  candidates?: readonly T[];
  hour?: number;
  findLabel?: string;
  /** An object picked in the search, as a line at its usual quantity. */
  toLine?: (item: T) => ComposerLine;
  /** The type's own search in place of the plain `Find` (still a `Find`, PAT-41). */
  search?: ReactNode;
  /** Before the lines, inside the form: the header, a name field, hidden values. */
  head?: ReactNode;
  /** The lines and the search as one titled section («Ingredienti · 3 · 540 kcal»). */
  title?: { label: string; node: ReactNode };
  /** What the lines add up to, recomputed as they change. */
  totals?: (lines: readonly ComposerLine[]) => ReactNode;
  /** Said while there is no line («Cerca un cibo da aggiungere»). */
  empty: ReactNode;
  errors?: Readonly<Record<string, string>>;
  saveLabel: string;
  /** «Salva» enabled; by default, once there is a line. */
  canSave?: boolean;
  cancelHref: string;
  action: (data: FormData) => void | Promise<void>;
  busy?: boolean;
  /** The type's own fields (when, servings, a note), before the foot. */
  children?: ReactNode;
}) {
  const [own, setOwn] = useState<readonly ComposerLine[]>(initial);
  const lines = given ?? own;
  const set = (next: ComposerLine[]) => (onLines ? onLines(next) : setOwn(next));
  const body = (
    <>
      {lines.length === 0 ? (
        typeof empty === "string" ? (
          <p className="k-meta">{empty}</p>
        ) : (
          empty
        )
      ) : (
        <div className="k-stack g2">
          {lines.map((l, i) => (
            <Box
              key={l.key + ":" + stamp}
              density="row"
              rail={false}
              entry={l.entry}
              acts={[
                ...(counted
                  ? []
                  : [
                      ...(i > 0
                        ? [
                            {
                              label: WORDS.composer.up,
                              aria: WORDS.composer.moveUp(l.entry.title),
                              onClick: () => set(moveLine(lines, l.key, -1)),
                            },
                          ]
                        : []),
                      ...(i < lines.length - 1
                        ? [
                            {
                              label: WORDS.composer.down,
                              aria: WORDS.composer.moveDown(l.entry.title),
                              onClick: () => set(moveLine(lines, l.key, 1)),
                            },
                          ]
                        : []),
                    ]),
                {
                  label: WORDS.composer.remove,
                  aria: WORDS.composer.remove + " " + l.entry.title,
                  onClick: () => set(removeLine(lines, l.key)),
                },
              ]}
            >
              <input type="hidden" name={`line.${i}.key`} value={l.key} />
              {counted && l.fixed && (
                <input type="hidden" name={`line.${i}`} value={l.quantity} />
              )}
              {counted && !l.fixed && (
                <Field
                  name={`line.${i}`}
                  label={WORDS.composer.quantity(l.entry.title)}
                  hideLabel
                  type="stepper"
                  unit={l.unit}
                  step={l.step}
                  defaultValue={l.quantity}
                  error={errors[`line.${i}`]}
                  onChange={(q) => set(setQuantity(lines, l.key, q))}
                />
              )}
              {l.below}
            </Box>
          ))}
        </div>
      )}
      {search ??
        (toLine && (
          <Find
            items={candidates.filter((c) => !lines.some((l) => l.key === c.id))}
            label={findLabel}
            hour={hour}
            onPick={(item) => set(addLine(lines, toLine(item)))}
          />
        ))}
    </>
  );
  return (
    <form className="k-stack g3 k-composer" action={action}>
      {head}
      {title ? (
        <section className="k-section g3" aria-label={title.label}>
          <h2>{title.node}</h2>
          {body}
        </section>
      ) : (
        body
      )}
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
          disabled={busy || !(canSave ?? lines.length > 0)}
          aria-busy={busy || undefined}
        >
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
