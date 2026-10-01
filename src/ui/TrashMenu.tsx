/**
 * ui/TrashMenu.tsx — the "⋯" menu of a page whose header is rendered by the
 * server (a detail page with an edit form inside, e.g. an exercise):
 * Delete moves the record to the trash with Undo (ui/useEditFlow useTrash);
 * other items (Duplicate…) can be added.
 */
"use client";

import { Trash2 } from "lucide-react";
import { Menu, type MenuItem } from "./Menu";
import { useTrash, type EditFlowLabels } from "./useEditFlow";

export function TrashMenu({
  id,
  from,
  name,
  trash,
  restore,
  items = [],
  labels,
}: {
  id: string;
  from: string;
  name: string;
  trash: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
  items?: MenuItem[];
  labels: Pick<EditFlowLabels, "deleted" | "restored" | "undo" | "undoFailed"> & {
    more: string;
    delete: string;
  };
}) {
  const onDelete = useTrash({ id, from, name: () => name, trash, restore, labels });
  return (
    <Menu
      label={labels.more}
      items={[
        ...items,
        {
          label: labels.delete,
          icon: <Trash2 size={16} aria-hidden="true" />,
          tone: "danger",
          onSelect: () => void onDelete?.(),
        },
      ]}
    />
  );
}
