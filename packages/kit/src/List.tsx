"use client";
/**
 * One list for every page (P6, ledger UI-41, UI-100): the first 8 rows,
 * then «Mostra altri (n)»; opened, the rest scroll inside a box of their
 * own (the developer, 3 Nov: «liste non cappate da barre a scorrimento»),
 * so the page below stays where it was, and «Mostra meno» closes it.
 * Rows come from the server as children; the list only windows them.
 */
import { Children, useState, type ReactNode } from "react";
import { Condensed } from "./Condensed";
import { LIST_WINDOW, listWindow } from "./list";

export function List({
  children,
  label,
  window = LIST_WINDOW,
  gap = 2,
  names,
  remember,
}: {
  children: ReactNode;
  /** What the list holds, for screen readers («Le pesate»). */
  label: string;
  window?: number;
  gap?: 1 | 2 | 3;
  /**
   * Each row's short name (his pick of 19 Nov, PAT-40): past the window the rest stand on one
   * line naming every one («e altri 14: …») that opens in place; without names, «Mostra altri».
   */
  names?: ReactNode[];
  /** The key the open state is kept under (VIS-70); the label when not given. */
  remember?: string;
}) {
  const rows = Children.toArray(children);
  const [open, setOpen] = useState(false);
  const { rest } = listWindow(rows.length, false, window);
  const head = rest > 0 ? rows.slice(0, window) : rows;
  const restRows = rows.slice(window).map((r, i) => (
    <div key={i} role="listitem">
      {r}
    </div>
  ));
  if (rest > 0 && names && names.length === rows.length)
    return (
      <div className={"k-stack g" + gap} role="list" aria-label={label}>
        {head.map((r, i) => (
          <div key={i} role="listitem">
            {r}
          </div>
        ))}
        <Condensed
          label={"e altri " + rest}
          names={names.slice(window)}
          remember={"list." + (remember ?? label)}
        >
          <div className={"k-stack g" + gap + " k-listmore"} tabIndex={0}>
            {restRows}
          </div>
        </Condensed>
      </div>
    );
  return (
    <div className={"k-stack g" + gap} role="list" aria-label={label}>
      {head.map((r, i) => (
        <div key={i} role="listitem">
          {r}
        </div>
      ))}
      {rest > 0 && open && (
        <div className={"k-stack g" + gap + " k-listmore"} tabIndex={0}>
          {restRows}
        </div>
      )}
      {rest > 0 && (
        <button
          type="button"
          className="k-btn link k-listbtn"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Mostra meno" : "Mostra altri (" + rest + ")"}
        </button>
      )}
    </div>
  );
}
