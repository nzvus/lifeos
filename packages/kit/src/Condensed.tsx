"use client";
/**
 * Condensed (PAT-40, his pick of 19 Nov: «condensare l'informazione ma mostrarla anche
 * interamente»): what does not need its own rows stands on one line that names every item
 * («e altri 14: A · C · B12 · …»); a tap anywhere on the line opens the full rows in place, «Meno»
 * closes them. The state is kept per piece (VIS-70), so the page opens the way it was left.
 */
import { Fragment, type ReactNode } from "react";
import { useLevel } from "./levels";
import { WORDS } from "./words";

export function Condensed({
  label,
  names,
  children,
  remember,
}: {
  /** What the line is («Non contano», «e altri 14»). */
  label: string;
  /** Every item's short name (or name with its swatch), in order: all in view, condensed. */
  names: ReactNode[];
  /** The full rows, shown when open. */
  children: ReactNode;
  /** The key its state is kept under (per piece, VIS-70). */
  remember: string;
}) {
  const [level, next] = useLevel("condensed." + remember, 1, 0);
  const open = level === 1;
  return (
    <div className="k-condensed">
      <button type="button" className="k-cline" aria-expanded={open} onClick={next}>
        <span className="k-help">{label}:</span>
        {/* two lines at most closed: a long list ends in «…», the rest is one tap away */}
        {!open && (
          <span className="k-cnames">
            {names.map((n, i) => (
              <Fragment key={i}>
                <span className="k-nowrap">
                  {n}
                  {i < names.length - 1 ? " ·" : ""}
                </span>{" "}
              </Fragment>
            ))}
          </span>
        )}
        <span className="k-cmore" aria-hidden="true">
          {open ? WORDS.less : "⌄"}
        </span>
      </button>
      {open && <div className="k-condensed-body">{children}</div>}
    </div>
  );
}
