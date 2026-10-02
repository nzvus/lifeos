/**
 * features/account/trash/TrashList.tsx — the rows of the trash page
 * (ADR-0015): what it is, its kind, its day, when it will be deleted for
 * good; a restore button, and a bin that deletes it for good after asking
 * (ui/DeleteButton): the one action without Undo.
 * Client component: the buttons, the confirmation and the toasts.
 */
"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { fill, type Messages } from "@/i18n";
import { ListItem } from "@/ui/ListItem";
import { DeleteButton } from "@/ui/DeleteButton";
import { toast } from "@/ui/Toast";
import { buttonClass } from "@/ui/button";

export type TrashRow = {
  kind: keyof Messages["trash"]["kinds"];
  id: string;
  /** Ready to show: the name, or a measurement's weight with its unit. */
  name: string;
  /** Ready to show: the record's day, or "". */
  day: string;
  /** Ready to show: the date of the purge. */
  purgeOn: string;
};

type Outcome = { ok: boolean; message?: string };

export function TrashList({
  rows,
  restore,
  purge,
  t,
}: {
  rows: TrashRow[];
  restore: (kind: string, id: string) => Promise<Outcome>;
  purge: (kind: string, id: string) => Promise<Outcome>;
  t: Pick<Messages, "trash" | "actions">;
}) {
  const router = useRouter();
  const run = async (
    action: typeof restore,
    row: TrashRow,
    done: string,
  ): Promise<void> => {
    const r = await action(row.kind, row.id);
    toast({ message: r.ok ? fill(done, { name: row.name }) : (r.message ?? "") });
    router.refresh();
  };
  if (rows.length === 0) return <p className="text-muted">{t.trash.empty}</p>;
  return (
    <ul className="flex flex-col">
      {rows.map((row) => (
        <ListItem
          key={`${row.kind}-${row.id}`}
          title={row.name}
          aside={t.trash.kinds[row.kind]}
          footer={[row.day, fill(t.trash.purgeOn, { date: row.purgeOn })]
            .filter(Boolean)
            .join(" · ")}
          action={
            <span className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t.trash.restore}
                title={t.trash.restore}
                onClick={() => void run(restore, row, t.trash.restored)}
                className={buttonClass({ variant: "subtle", iconOnly: true })}
              >
                <RotateCcw size={20} aria-hidden="true" />
              </button>
              <DeleteButton
                onConfirm={() => void run(purge, row, t.trash.purged)}
                title={fill(t.trash.confirm, { name: row.name })}
                labels={{ delete: t.trash.purge, cancel: t.trash.cancel }}
              />
            </span>
          }
        ></ListItem>
      ))}
    </ul>
  );
}
