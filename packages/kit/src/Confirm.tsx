"use client";
/**
 * Confirm (PAT-73): only for what cannot be undone. A sheet asks in words; «Annulla» and the
 * destructive verb, which names what it destroys, last and in tomato. Never `window.confirm`.
 */
import { Sheet } from "./Sheet";
import { WORDS } from "./words";

export function Confirm({
  open,
  question,
  detail,
  verb,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  /** «Unire Run in Corsa?» */
  question: string;
  /** What will happen, in his words. */
  detail?: string;
  /** The destructive verb naming its object: «Unisci», «Elimina la scheda». */
  verb: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet
      open={open}
      title={question}
      onClose={onCancel}
      foot={
        <>
          <button type="button" className="k-btn secondary" onClick={onCancel}>
            {WORDS.cancel}
          </button>
          <button
            type="button"
            className="k-btn primary danger"
            aria-busy={busy || undefined}
            disabled={busy}
            onClick={onConfirm}
          >
            {verb}
          </button>
        </>
      }
    >
      {detail && <p className="k-body">{detail}</p>}
    </Sheet>
  );
}
