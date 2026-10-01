/**
 * ui/TrashMenu.tsx — the "⋯" menu of a page whose header is rendered by the
 * server (a detail page with an edit form inside, e.g. an exercise):
 * Delete moves the record to the trash with Undo (ui/useEditFlow useTrash);
 * other items can be added: links (Duplicate…) and server actions run on
 * this record ("Make default"), which say how it went in a toast.
 */
"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "./Toast";
import { Menu, type MenuItem } from "./Menu";
import { useTrash, type EditFlowLabels } from "./useEditFlow";

export function TrashMenu({
  id,
  from,
  name,
  trash,
  restore,
  items = [],
  actions = [],
  labels,
}: {
  id: string;
  from: string;
  name: string;
  trash: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
  items?: MenuItem[];
  /** Server actions on this record: their label and what to say when done. */
  actions?: {
    label: string;
    run: (id: string) => Promise<{ ok: boolean; message?: string }>;
    done: string;
  }[];
  labels: Pick<EditFlowLabels, "deleted" | "restored" | "undo" | "undoFailed"> & {
    more: string;
    delete: string;
  };
}) {
  const router = useRouter();
  const onDelete = useTrash({ id, from, name: () => name, trash, restore, labels });
  const run = async (a: (typeof actions)[number]) => {
    const r = await a.run(id);
    toast({ message: r.ok ? a.done : (r.message ?? "") });
    router.refresh();
  };
  return (
    <Menu
      label={labels.more}
      items={[
        ...items,
        ...actions.map((a) => ({ label: a.label, onSelect: () => void run(a) })),
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
