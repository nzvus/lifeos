"use client";
/**
 * EntryHeader (PAT-31): the same head on every open voce — quanto (× servings or quantity, with
 * − / +) · quando (time and previsto / fatto / saltato) · ↺ only when its catalog object changed
 * after it (MOD-11) · «⋯». The body below edits in place.
 */
import { Glyph } from "./Glyph";
import { WORDS } from "./words";

export type EntryStatus = keyof typeof WORDS.status;

export function EntryHeader({
  amount,
  when,
  onStep,
  onRefresh,
  onMore,
}: {
  /** «× 1,5» or «80 g». */
  amount: string;
  when: { time: string; status: EntryStatus };
  onStep?: (by: -1 | 1) => void;
  /** Given only when the catalog object changed after this voce. */
  onRefresh?: () => void;
  onMore: () => void;
}) {
  return (
    <div className="k-entryhead">
      <div className="k-stack g1">
        <div className="k-line">
          {onStep && (
            <button
              type="button"
              className="k-btn act icon"
              aria-label={WORDS.less}
              onClick={() => onStep(-1)}
            >
              −
            </button>
          )}
          <span className="k-amount">{amount}</span>
          {onStep && (
            <button
              type="button"
              className="k-btn act icon"
              aria-label={WORDS.plus}
              onClick={() => onStep(1)}
            >
              +
            </button>
          )}
        </div>
        <span className="k-meta">
          {when.time} ·{" "}
          <span className={"k-status " + when.status}>{WORDS.status[when.status]}</span>
        </span>
      </div>
      <div className="k-line">
        {onRefresh && (
          <button
            type="button"
            className="k-btn act icon"
            aria-label={WORDS.refresh}
            title={WORDS.refresh}
            onClick={onRefresh}
          >
            <Glyph of={{ ui: "refresh" }} decorative />
          </button>
        )}
        <button
          type="button"
          className="k-btn act icon"
          aria-label={WORDS.more}
          onClick={onMore}
        >
          <Glyph of={{ ui: "more" }} decorative />
        </button>
      </div>
    </div>
  );
}
