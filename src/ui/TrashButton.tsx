/**
 * ui/TrashButton.tsx — the compact delete button of a row in a list (a log
 * entry, a measurement): moves the record to the trash and stays on the
 * page, "«name» moved to the trash · Undo" (ADR-0015, ui/useEditFlow
 * useTrash). The server actions are passed as they are, not bound or
 * wrapped, so the page can render this from the server.
 */
"use client";

import { Trash2 } from "lucide-react";
import { SubmitButton } from "./SubmitButton";
import { useTrash, type EditFlowLabels } from "./useEditFlow";

export function TrashButton({
  id,
  name,
  trash,
  restore,
  label,
  labels,
}: {
  id: string;
  name: string;
  trash: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
  /** The button's text, for screen readers and as tooltip. */
  label: string;
  labels: Pick<EditFlowLabels, "deleted" | "restored" | "undo" | "undoFailed">;
}) {
  const onDelete = useTrash({ id, name: () => name, trash, restore, labels });
  return (
    <form action={async () => void (await onDelete?.())}>
      <SubmitButton
        variant="quiet"
        icon={<Trash2 size={18} aria-hidden="true" />}
        iconOnly
      >
        {label}
      </SubmitButton>
    </form>
  );
}
