/**
 * ui/DraftNotice.tsx — "You have changes from an earlier visit that were
 * not saved. Restore them · Discard" (ADR-0015, ui/useDraft).
 */
"use client";

import { FormAlert } from "./FormAlert";
import { TEXT_LINK } from "./button";

export function DraftNotice({
  onRestore,
  onDiscard,
  labels,
}: {
  onRestore: () => void;
  onDiscard: () => void;
  labels: { draftFound: string; draftRestore: string; draftDiscard: string };
}) {
  return (
    <FormAlert tone="info">
      <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>{labels.draftFound}</span>
        <button
          type="button"
          onClick={onRestore}
          className={`font-semibold ${TEXT_LINK}`}
        >
          {labels.draftRestore}
        </button>
        <button type="button" onClick={onDiscard} className={TEXT_LINK}>
          {labels.draftDiscard}
        </button>
      </span>
    </FormAlert>
  );
}
