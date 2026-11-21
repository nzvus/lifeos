"use client";
/**
 * KinRows (PAT-103, his §157): a thing's parents and children as two sideways rows, each headed by
 * its icon and drawn in its own colour (VIS-06: they scroll, never wrap). A parent reads «× k ·
 * name», the multiplier first; a stored one is stepped in place (− k +, PAT-13), a found one only
 * says it. A name is cut by the chip's width. Each row ends with a «+» that opens a search in place
 * under the rows (no pop-up): a pick adds a parent, or makes a child. The kit knows no type (PAT-81).
 */
import { useState } from "react";
import { Find, type FindItem } from "./Find";
import { Glyph } from "./Glyph";

export type KinChip = {
  key: string;
  name: string;
  /** «× 1,5», already formatted. */
  k: string;
  href?: string;
  /** A stored link: its multiplier is stepped here. */
  step?: { minus: string; plus: string; onMinus: () => void; onPlus: () => void };
};

type Side = "parents" | "children";
/** The caller's words (PAT-81): each row's name and its «+»'s, and the search's. */
export type KinWords = Record<Side, { row: string; add: string }> & { find: string };

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
  const row = (side: Side, chips: KinChip[], add?: () => void) => (
    <div className={"k-hrow k-kinrow " + side} role="group" aria-label={words[side].row}>
      <span className="k-kinhead" title={words[side].row}>
        <Glyph of={{ ui: side }} decorative />
      </span>
      {chips.map((c) => (
        <span key={c.key} className="k-chip static k-hchip k-kin">
          {c.step ? (
            <span className="k-line g1 k-step" role="group" aria-label={c.name}>
              <button
                type="button"
                className="k-btn act"
                aria-label={c.step.minus}
                onClick={c.step.onMinus}
              >
                −
              </button>
              <b className="k-num" aria-live="polite">
                {c.k}
              </b>
              <button
                type="button"
                className="k-btn act"
                aria-label={c.step.plus}
                onClick={c.step.onPlus}
              >
                +
              </button>
            </span>
          ) : (
            <b className="k-num">{c.k}</b>
          )}
          {c.href ? (
            <a className="k-kinname" href={c.href} title={c.name}>
              {c.name}
            </a>
          ) : (
            <span className="k-kinname" title={c.name}>
              {c.name}
            </span>
          )}
        </span>
      ))}
      {add && (
        <button
          type="button"
          className="k-btn act icon k-kinadd"
          aria-label={words[side].add}
          {...(side === "parents" ? { "aria-expanded": finding } : {})}
          onClick={add}
        >
          <Glyph of={{ ui: "add" }} decorative />
          <Glyph of={{ ui: side }} decorative />
        </button>
      )}
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
