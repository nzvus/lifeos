"use client";
/**
 * MergeSheet (PAT-18, PAT-73): «Unisci» in two steps inside one sheet. First «Quale è la stessa
 * cosa?» — a `Find` over the other objects of the type; then what moves, in words the caller
 * gives (its `preview`), «Non si può annullare.», and «Annulla» / «Unisci». The page is the one
 * kept; the one picked goes into it. The kit knows no type: items, sentences and callbacks.
 */
import { useState } from "react";
import { Banner } from "./Banner";
import { Find, type FindItem } from "./Find";
import { Sheet } from "./Sheet";
import { WORDS } from "./words";

export function MergeSheet<T extends FindItem>({
  open,
  keep,
  candidates,
  hour,
  findLabel,
  preview,
  onConfirm,
  onClose,
  initial,
}: {
  open: boolean;
  /** The name of the one kept (the page's object). */
  keep: string;
  /** The others it may be merged with. */
  candidates: readonly T[];
  hour: number;
  findLabel: string;
  /** What moves when `other` goes into `keep`, one sentence each. */
  preview: (other: T) => Promise<readonly string[]>;
  /** Merges; answers an error to show, or null. */
  onConfirm: (other: T) => Promise<string | null>;
  onClose: () => void;
  /** Start on the second step (the gallery's photo). */
  initial?: { other: T; lines: readonly string[] };
}) {
  const [other, setOther] = useState<T | null>(initial?.other ?? null);
  const [lines, setLines] = useState<readonly string[] | null>(initial?.lines ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const back = () => {
    setOther(null);
    setLines(null);
    setError(null);
  };
  const close = () => {
    back();
    onClose();
  };
  const pick = async (o: T) => {
    setOther(o);
    setLines(null);
    setLines(await preview(o));
  };
  const confirm = async () => {
    if (!other) return;
    setBusy(true);
    const refused = await onConfirm(other);
    setBusy(false);
    if (refused) setError(refused);
    else close();
  };
  if (!other)
    return (
      <Sheet
        open={open}
        title={WORDS.merge.into(keep)}
        meta={WORDS.verbs.merge}
        onClose={close}
      >
        <p className="k-body">{WORDS.merge.pick}</p>
        <Find
          items={candidates}
          label={findLabel}
          hour={hour}
          all
          onPick={(o) => void pick(o)}
        />
      </Sheet>
    );
  return (
    <Sheet
      open={open}
      title={WORDS.merge.which(other.name, keep)}
      meta={WORDS.verbs.merge}
      onClose={close}
      foot={
        <>
          <button type="button" className="k-btn secondary" onClick={back}>
            {WORDS.merge.other}
          </button>
          <button
            type="button"
            className="k-btn primary danger"
            aria-busy={busy || undefined}
            disabled={busy || lines === null}
            onClick={() => void confirm()}
          >
            {WORDS.verbs.merge}
          </button>
        </>
      }
    >
      {error && <Banner text={error} />}
      {lines === null ? (
        <div className="k-skel" aria-busy="true" />
      ) : (
        <ul className="k-stack g2 k-body">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
          <li className="k-meta">{WORDS.merge.once}</li>
        </ul>
      )}
    </Sheet>
  );
}
