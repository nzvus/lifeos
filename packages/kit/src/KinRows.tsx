"use client";
/**
 * KinRows (PAT-103, his §157, §160, §163): a thing's parents and children as two sideways rows,
 * told apart by colour (VIS-06: they scroll, never wrap). Each row starts with its «+» and the
 * row's icon, as small as a chip; a row with no chips is that button alone, square, the row's full
 * width, its words written. A chip has two zones: its multiplier (a bare number) opens in place
 * into − k + (PAT-13), its name goes to that thing. «+» on the parents' row opens a search in a
 * small fixed window under the rows, its results scrolling inside; on the children's it makes one. The kit knows no type (PAT-81): words and callbacks come from the caller.
 */
import { useState } from "react";
import { Find, type FindItem } from "./Find";
import { Glyph } from "./Glyph";

export type KinChip = {
  key: string;
  name: string;
  /** The multiplier, already formatted, a bare number («1,5»; his §163: no «×»). */
  k: string;
  /** Its name goes to that thing: a callback in place, else a link. */
  onGo?: () => void;
  href?: string;
  /** Its multiplier, stepped when the «× k» is opened. */
  step?: { minus: string; plus: string; onMinus: () => void; onPlus: () => void };
};

type Side = "parents" | "children";
/** The caller's words (PAT-81): each row's name and its «+»'s, the search's, «× k» opened. */
export type KinWords = Record<Side, { row: string; add: string }> & {
  find: string;
  edit: (name: string) => string;
};

export function KinRows({
  parents,
  children,
  candidates,
  hour,
  onAddParent,
  onAddChild,
  words,
}: {
  words: KinWords;
  parents: KinChip[];
  children: KinChip[];
  /** What a «+ genitore» search offers. */
  candidates: readonly FindItem[];
  hour: number;
  onAddParent?: (id: string) => void;
  /** A child is a new copy of this thing: no search, one tap. */
  onAddChild?: () => void;
}) {
  const [finding, setFinding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  // a parent's tile in its tone, the same as its share of the ingredients' grounds: the row is
  // their legend (his §180, «quando ci sono più genitori»)
  const chip = (side: Side, c: KinChip, n = 0) => {
    const id = side + ":" + c.key;
    const editing = open === id && !!c.step;
    return (
      <span
        key={c.key}
        className={
          "k-chip static k-hchip k-kin" +
          (side === "parents" ? " t" + (n % 3) : "") +
          (editing ? " open" : "")
        }
      >
        {editing ? (
          <span className="k-line g1 k-step" role="group" aria-label={words.edit(c.name)}>
            <button
              type="button"
              className="k-btn act"
              aria-label={c.step!.minus}
              onClick={c.step!.onMinus}
            >
              −
            </button>
            <button
              type="button"
              className="k-num k-kink"
              aria-expanded
              aria-label={words.edit(c.name)}
              onClick={() => setOpen(null)}
            >
              {c.k}
            </button>
            <button
              type="button"
              className="k-btn act"
              aria-label={c.step!.plus}
              onClick={c.step!.onPlus}
            >
              +
            </button>
          </span>
        ) : c.step ? (
          <button
            type="button"
            className="k-num k-kink"
            aria-expanded={false}
            aria-label={words.edit(c.name)}
            onClick={() => setOpen(id)}
          >
            {c.k}
          </button>
        ) : (
          <b className="k-num k-kink">{c.k}</b>
        )}
        {c.onGo ? (
          <button type="button" className="k-kinname" title={c.name} onClick={c.onGo}>
            {c.name}
          </button>
        ) : c.href ? (
          <a className="k-kinname" href={c.href} title={c.name}>
            {c.name}
          </a>
        ) : (
          <span className="k-kinname" title={c.name}>
            {c.name}
          </span>
        )}
      </span>
    );
  };
  const row = (side: Side, chips: KinChip[], add?: () => void) => (
    <div className={"k-hrow k-kinrow " + side} role="group" aria-label={words[side].row}>
      {add && (
        <button
          type="button"
          className={"k-chip k-hchip k-kinadd" + (chips.length === 0 ? " wide" : "")}
          aria-label={words[side].add}
          {...(side === "parents" ? { "aria-expanded": finding } : {})}
          onClick={add}
        >
          <Glyph of={{ ui: "add" }} decorative />
          <Glyph of={{ ui: side }} decorative />
          {chips.length === 0 && <span>{words[side].add}</span>}
        </button>
      )}
      {chips.map((c, n) => chip(side, c, n))}
    </div>
  );
  return (
    <div className="k-stack g1 k-kinrows">
      {row("parents", parents, onAddParent ? () => setFinding((f) => !f) : undefined)}
      {finding && onAddParent && (
        <div className="k-kinfind">
          <Find
            items={candidates}
            label={words.find}
            hour={hour}
            all
            autoFocus
            onPick={(x) => {
              setFinding(false);
              onAddParent(x.id);
            }}
          />
        </div>
      )}
      {row("children", children, onAddChild)}
    </div>
  );
}
