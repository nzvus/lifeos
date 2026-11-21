"use client";
/**
 * KinRows (PAT-103, his §157, §160): a thing's parents and children as two sideways rows, told
 * apart by colour alone (VIS-06: they scroll, never wrap). Each row starts with its «+», as small
 * as a chip. A chip has two zones: its «× k» opens in place into − k + (PAT-13), its name goes to
 * that thing. «+» on the parents' row opens a search under the rows (no pop-up); on the children's
 * it makes one at once. The kit knows no type (PAT-81): words and callbacks come from the caller.
 */
import { useState } from "react";
import { Find, type FindItem } from "./Find";
import { Glyph } from "./Glyph";

export type KinChip = {
  key: string;
  name: string;
  /** «× 1,5», already formatted. */
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
  const chip = (side: Side, c: KinChip) => {
    const id = side + ":" + c.key;
    const editing = open === id && !!c.step;
    return (
      <span
        key={c.key}
        className={"k-chip static k-hchip k-kin" + (editing ? " open" : "")}
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
          className="k-chip k-hchip k-kinadd"
          aria-label={words[side].add}
          {...(side === "parents" ? { "aria-expanded": finding } : {})}
          onClick={add}
        >
          <Glyph of={{ ui: "add" }} decorative />
        </button>
      )}
      {chips.map((c) => chip(side, c))}
    </div>
  );
  return (
    <div className="k-stack g1 k-kinrows">
      {row("parents", parents, onAddParent ? () => setFinding((f) => !f) : undefined)}
      {finding && onAddParent && (
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
      )}
      {row("children", children, onAddChild)}
    </div>
  );
}
