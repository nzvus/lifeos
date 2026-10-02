/**
 * ui/TrashMenu.tsx — a record's actions: in the header of a detail page
 * rendered by the server (e.g. an exercise), or on a row of a list.
 * Delete is a visible bin that asks first (ui/DeleteButton), then moves the
 * record to the trash with Undo (ui/useEditFlow useTrash) and goes back to
 * `from` (a detail page) or stays (a row, no `from`). Other actions —
 * links (Duplicate…) and server actions on this record ("Make default"),
 * which say how it went in a toast — sit in a "⋯" beside it, only when
 * there are some.
 */
"use client";

import { useRouter } from "next/navigation";
import { DeleteButton } from "./DeleteButton";
import { toast } from "./Toast";
import { Menu, type MenuItem } from "./Menu";
import { fill } from "@/i18n";
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
  from?: string;
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
    close?: string;
    delete: string;
    cancel: string;
    confirmDelete: string;
    confirmDeleteHint: string;
  };
}) {
  const router = useRouter();
  const onDelete = useTrash({ id, from, name: () => name, trash, restore, labels });
  const run = async (a: (typeof actions)[number]) => {
    const r = await a.run(id);
    toast({ message: r.ok ? a.done : (r.message ?? "") });
    router.refresh();
  };
  const others = [
    ...items,
    ...actions.map((a) => ({ label: a.label, onSelect: () => void run(a) })),
  ];
  return (
    <div className="flex items-center gap-1">
      {others.length > 0 && (
        <Menu label={labels.more} items={others} closeLabel={labels.close} />
      )}
      {onDelete && (
        <DeleteButton
          onConfirm={() => void onDelete()}
          title={fill(labels.confirmDelete, { name })}
          hint={labels.confirmDeleteHint}
          labels={labels}
        />
      )}
    </div>
  );
}
