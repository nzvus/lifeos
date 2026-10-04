/**
 * features/money/MovementDelete.tsx — the movement page's bin: asks first,
 * moves it to the trash, goes back, and offers Undo (ADR-0015).
 */
"use client";

import { useRouter } from "next/navigation";
import type { Messages } from "@/i18n";
import { DeleteButton } from "@/ui/DeleteButton";
import { toast } from "@/ui/Toast";

type Outcome = { ok: boolean; message?: string };

export function MovementDelete({
  id,
  back,
  trash,
  restore,
  t,
}: {
  id: string;
  back: string;
  trash: (id: string) => Promise<Outcome>;
  restore: (id: string) => Promise<Outcome>;
  t: Pick<Messages, "money" | "actions">;
}) {
  const router = useRouter();
  return (
    <DeleteButton
      title={t.money.deleteAsk}
      hint={t.actions.confirmDeleteHint}
      labels={{ delete: t.actions.delete, cancel: t.actions.cancel }}
      onConfirm={async () => {
        const r = await trash(id);
        if (!r.ok) return toast({ message: r.message ?? "" });
        router.push(back);
        toast({
          message: t.money.deleted,
          action: {
            label: t.actions.undo,
            run: async () => {
              await restore(id);
              router.refresh();
            },
          },
        });
      }}
    />
  );
}
