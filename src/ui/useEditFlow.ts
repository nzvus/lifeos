/**
 * ui/useEditFlow.ts — what saving and deleting do on every edit page
 * (ADR-0015), so each form only describes its fields:
 *   - Save: run the action; when it reports "saved", clear the draft, go
 *     back to `from`, and say "«name» saved · Undo" (Undo runs the action
 *     again with the previous version's fields);
 *   - Delete: move to the trash, go back to `from`, "«name» moved to the
 *     trash · Undo" (Undo restores it).
 * Generic: the form state type and its idle value come from the caller
 * (ui/ may import core types).
 */
"use client";

import { noteReturn } from "./ScrollMemory";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { fill } from "@/i18n";
import { toast } from "./Toast";

type Outcome = { ok: boolean; message?: string };

export type EditFlowLabels = {
  saved: string;
  created: string;
  deleted: string;
  restored: string;
  undo: string;
  undoFailed: string;
};

export function useEditFlow<S extends { status: string }>(opts: {
  /** The record's id; absent while creating. */
  id?: string;
  from: string;
  idle: S;
  action: (prev: S, fd: FormData) => Promise<S>;
  /** The saved version's fields, for "Undo" after saving. */
  previous: () => FormData;
  /** The name to show in messages ("«Porridge» saved"). */
  name: () => string;
  trash?: (id: string) => Promise<Outcome>;
  restore?: (id: string) => Promise<Outcome>;
  /** Called after a successful save or delete (clear the draft). */
  done?: () => void;
  labels: EditFlowLabels;
}) {
  const { id, from, idle, action, previous, name, trash, restore, done, labels } = opts;
  const router = useRouter();

  const [state, formAction] = useActionState(
    async (prev: S, fd: FormData): Promise<S> => {
      const r = await action(prev as S, fd);
      if (r.status !== "saved") return r;
      done?.();
      const before = previous();
      toast({
        message: fill(id ? labels.saved : labels.created, { name: name() }),
        action: id
          ? {
              label: labels.undo,
              run: async () => {
                const u = await action(idle, before);
                toast({
                  message:
                    u.status === "saved"
                      ? labels.restored
                      : fill(labels.undoFailed, { why: "" }),
                });
                router.refresh();
              },
            }
          : undefined,
      });
      noteReturn(from); // back where the user was (ui/ScrollMemory)
      router.push(from);
      return r;
    },
    // S is a plain object type, so Awaited<S> is S; a generic hides that.
    idle as Awaited<S>,
  );

  const onDelete = useTrash({ id, from, name, trash, restore, done, labels });

  return { state, formAction, onDelete };
}

/**
 * Delete = move to the trash, go back to `from` (or stay, for a row in a
 * list), "«name» moved to the trash · Undo". Undefined when there is
 * nothing to delete (a new record).
 */
export function useTrash(opts: {
  id?: string;
  /** Where to go once deleted; omitted = stay on this page (a row). */
  from?: string;
  name: () => string;
  trash?: (id: string) => Promise<Outcome>;
  restore?: (id: string) => Promise<Outcome>;
  done?: () => void;
  labels: Pick<EditFlowLabels, "deleted" | "restored" | "undo" | "undoFailed">;
}) {
  const { id, from, name, trash, restore, done, labels } = opts;
  const router = useRouter();
  if (!id || !trash || !restore) return undefined;
  return async () => {
    const shown = name();
    const r = await trash(id);
    if (!r.ok) {
      toast({ message: r.message ?? "" });
      return;
    }
    done?.();
    toast({
      message: fill(labels.deleted, { name: shown }),
      action: {
        label: labels.undo,
        run: async () => {
          const u = await restore(id);
          toast({
            message: u.ok
              ? labels.restored
              : fill(labels.undoFailed, { why: u.message ?? "" }),
          });
          router.refresh();
        },
      },
    });
    if (from) {
      noteReturn(from);
      router.push(from);
    } else router.refresh();
  };
}
