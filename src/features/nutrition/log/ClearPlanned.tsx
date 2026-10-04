/**
 * features/nutrition/log/ClearPlanned.tsx — "Remove what's still planned"
 * on a day: after a restaurant's menu was planned whole, what was not
 * chosen goes to the trash in one tap, with one Undo (ADR-0015). Asks
 * first, like every delete. Client component.
 */
"use client";

import { useRouter } from "next/navigation";
import { fill, type Messages } from "@/i18n";
import { DeleteButton } from "@/ui/DeleteButton";
import { toast } from "@/ui/Toast";

export function ClearPlanned({
  day,
  count,
  trash,
  restore,
  t,
}: {
  day: string;
  /** How many entries of the day are still planned. */
  count: number;
  trash: (day: string) => Promise<string[]>;
  restore: (ids: string[]) => Promise<void>;
  t: Pick<Messages, "actions" | "day">;
}) {
  const router = useRouter();
  return (
    <DeleteButton
      text={fill(t.day.clearPlanned, { n: String(count) })}
      title={fill(t.day.clearPlannedAsk, { n: String(count) })}
      hint={t.day.clearPlannedHint}
      labels={{ delete: t.actions.delete, cancel: t.actions.cancel }}
      onConfirm={async () => {
        const ids = await trash(day);
        router.refresh();
        toast({
          message: fill(t.day.clearedPlanned, { n: String(ids.length) }),
          action: {
            label: t.actions.undo,
            run: async () => {
              await restore(ids);
              router.refresh();
            },
          },
        });
      }}
    />
  );
}
