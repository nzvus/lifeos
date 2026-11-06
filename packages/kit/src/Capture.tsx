"use client";
/**
 * Capture (PAT-60, PAT-10): what ⊕ opens anywhere — one `Find` over every type and every
 * object. With nothing typed, the types, the current area's first (each a row that opens its
 * form); typing searches the types and the objects together (one matcher, PAT-41), so «caffè»
 * finds the food and «peso» the kind. The kit knows no type: rows and words from the caller.
 */
import { Find, type FindItem } from "./Find";
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
  types,
  objects,
  hour,
  onPick,
  onClose,
}: {
  open: boolean;
  /** The area ⊕ was tapped in («Cibo»), or null on Oggi. */
  area: string | null;
  types: readonly T[];
  objects: readonly T[];
  hour: number;
  onPick: (item: T) => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      title={WORDS.capture.title}
      {...(area ? { meta: area } : {})}
      onClose={onClose}
    >
      <Find
        items={[...types, ...objects]}
        idle={captureIdle(types, area)}
        label={WORDS.capture.search}
        hour={hour}
        autoFocus
        onPick={onPick}
      />
    </Sheet>
  );
}
