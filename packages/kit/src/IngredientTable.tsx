"use client";
/**
 * IngredientTable (his §172; PAT-13, PAT-103): a whole's parts as a table of two columns — the
 * names, each one's background shared out among the parents it comes from in exact proportion
 * (the rest its own, plain), and the amounts, which a tap turns into a field with its cursor (no −
 * +, the cell never widens); Enter or leaving saves, Esc puts it back. A row swiped left is taken
 * out. The first row adds one. The kit knows no type (PAT-81): rows, words and callbacks.
 */
import { useRef, useState, type CSSProperties } from "react";
import { Glyph } from "./Glyph";

export type IngredientRow = {
  key: string;
  name: string;
  meta?: string;
  /** Its amount as shown («120 g»), its number and unit for the field. */
  amount: string;
  value: number;
  unit: string;
  /** The share of it each parent brings, in %, by the parent's tone (0, 1, 2 …); the rest is own. */
  shares: { tone: number; w: number }[];
  /** Whether its amount can be changed here (a part that is not all its parents'). */
  editable: boolean;
};

const TONES = 3;

/** The name cell's background: each parent's share in its tone, side by side, the rest plain. */
export function shareBackground(shares: IngredientRow["shares"]): string | undefined {
  if (shares.length === 0) return undefined;
  let at = 0;
  const stops = shares.map((s) => {
    const from = at;
    at = Math.min(100, at + s.w);
    const c = `var(--kin-t${s.tone % TONES})`;
    return `${c} ${from.toFixed(1)}% ${at.toFixed(1)}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")}, transparent ${at.toFixed(1)}%)`;
}

export function IngredientTable({
  rows,
  onSet,
  onRemove,
  onAdd,
  words,
}: {
  rows: IngredientRow[];
  onSet: (key: string, value: number) => void;
  onRemove: (key: string) => void;
  onAdd: () => void;
  words: { add: string; edit: (name: string) => string; remove: string };
}) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="k-itable" role="table">
      <button type="button" className="k-irow k-iadd" onClick={onAdd}>
        <Glyph of={{ ui: "add" }} decorative />
        <span>{words.add}</span>
      </button>
      {rows.map((r) => (
        <Row
          key={r.key}
          r={r}
          editing={editing === r.key}
          onEdit={(on) => setEditing(on ? r.key : null)}
          onSet={(v) => onSet(r.key, v)}
          onRemove={() => onRemove(r.key)}
          words={words}
        />
      ))}
    </div>
  );
}

function Row({
  r,
  editing,
  onEdit,
  onSet,
  onRemove,
  words,
}: {
  r: IngredientRow;
  editing: boolean;
  onEdit: (on: boolean) => void;
  onSet: (v: number) => void;
  onRemove: () => void;
  words: { edit: (name: string) => string; remove: string };
}) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const commit = (raw: string) => {
    onEdit(false);
    const v = Number(raw.replace(",", ".").trim());
    if (Number.isFinite(v) && v > 0 && v !== r.value) onSet(v);
  };
  const bg = shareBackground(r.shares);
  const style: CSSProperties = dx ? { transform: `translateX(${dx}px)` } : {};
  return (
    <div className="k-iswipe" role="row">
      {r.editable && (
        <span className="k-iunder" aria-hidden="true">
          {words.remove}
        </span>
      )}
      <div
        className="k-irow"
        style={style}
        onPointerDown={(e) => {
          if (r.editable && !editing) start.current = e.clientX;
        }}
        onPointerMove={(e) => {
          if (start.current !== null) setDx(Math.min(0, e.clientX - start.current));
        }}
        onPointerUp={() => {
          if (start.current !== null && dx < -72) onRemove();
          start.current = null;
          setDx(0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDx(0);
        }}
      >
        <span
          className="k-iname"
          role="cell"
          {...(bg ? { style: { background: bg } } : {})}
        >
          <span className="k-clip">{r.name}</span>
          {r.meta && <span className="k-meta k-clip">{r.meta}</span>}
        </span>
        <span className="k-iqty" role="cell">
          {editing ? (
            <input
              className="k-iinput"
              type="text"
              inputMode="decimal"
              aria-label={words.edit(r.name)}
              defaultValue={String(r.value).replace(".", ",")}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onBlur={(e) => commit(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit(e.currentTarget.value);
                if (e.key === "Escape") onEdit(false);
              }}
            />
          ) : r.editable ? (
            <button
              type="button"
              className="k-iamount"
              aria-label={words.edit(r.name)}
              onClick={() => onEdit(true)}
            >
              {r.amount}
            </button>
          ) : (
            <span className="k-iamount fixed">{r.amount}</span>
          )}
        </span>
      </div>
    </div>
  );
}
