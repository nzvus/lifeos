"use client";
/**
 * Capture (PAT-60, PAT-10): what ⊕ opens anywhere — a sheet with one `Find` over every type and
 * every object. With nothing typed: the caller's ranked rows first (`children`: the day's
 * previsti, what he logs at this hour, water in one tap…), then the types, the current area's
 * first (each a row that opens its form); typing searches the types and the objects together
 * (one matcher, PAT-41), so «caffè» finds the food and «peso» the kind, and the rows at rest
 * step aside. The kit knows no type: rows and words from the caller.
 */
import { useState, type ReactNode } from "react";
import { Find, type FindItem } from "./Find";
import { List } from "./List";
import { Sheet } from "./Sheet";
import { WORDS } from "./words";

export type CaptureItem = FindItem & { href: string; area?: string };

/** The types as ⊕ lists them with nothing typed: the current area's first, then by use. */
export function captureIdle<T extends CaptureItem>(
  types: readonly T[],
  area: string | null,
): T[] {
  return [...types].sort(
    (a, b) =>
      Number(b.area === area) - Number(a.area === area) ||
      (b.uses ?? 0) - (a.uses ?? 0) ||
      a.name.localeCompare(b.name, "it"),
  );
}

export function Capture<T extends CaptureItem>({
  open,
  area,
  meta,
  types,
  objects,
  hour,
  label = WORDS.capture.search,
  onPick,
  onClose,
  children,
}: {
  open: boolean;
  /** The area ⊕ was tapped in («Cibo»), or null on Oggi. */
  area: string | null;
  /** Said beside the title («oggi · Cibo»); the area by default. */
  meta?: string;
  types: readonly T[];
  objects: readonly T[];
  hour: number;
  /** The field's words («Cerca tra 157 cose»). */
  label?: string;
  onPick: (item: T) => void;
  onClose: () => void;
  /** The ranked rows at rest, before the types; hidden while something is typed. */
  children?: ReactNode;
}) {
  const [typed, setTyped] = useState(false);
  const rest = captureIdle(types, area);
  const title = meta ?? area;
  return (
    <Sheet
      open={open}
      title={WORDS.capture.title}
      {...(title ? { meta: title } : {})}
      onClose={onClose}
      foot={
        <button type="button" className="k-btn secondary k-grow" onClick={onClose}>
          {WORDS.close}
        </button>
      }
    >
      <Find
        items={[...types, ...objects]}
        idle={[]}
        label={label}
        hour={hour}
        autoFocus={!children}
        onQuery={(q) => setTyped(q.trim() !== "")}
        onPick={onPick}
      />
      {!typed && children}
      {!typed && rest.length > 0 && (
        <List label={WORDS.capture.types}>
          {rest.map((t) => (
            <button
              key={t.id}
              type="button"
              className="k-findrow"
              onClick={() => onPick(t)}
            >
              <span className="k-title">{t.name}</span>
              {t.meta && <span className="k-meta">{t.meta}</span>}
            </button>
          ))}
        </List>
      )}
    </Sheet>
  );
}
