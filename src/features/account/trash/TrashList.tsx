/**
 * features/account/trash/TrashList.tsx — the rows of the trash page
 * (ADR-0015): what it is, its kind, its day, when it will be deleted for
 * good; "⋯" restores it or deletes it for good. Deleting for good is the
 * one action without Undo, so it asks first, inline under the row.
 * Client component: the menu, the confirmation and the toasts.
 */
"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fill, type Messages } from "@/i18n";
import { ListItem } from "@/ui/ListItem";
import { Menu } from "@/ui/Menu";
import { toast } from "@/ui/Toast";

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
  const [confirming, setConfirming] = useState<string | null>(null);
  const run = async (
    action: typeof restore,
    row: TrashRow,
    done: string,
  ): Promise<void> => {
    const r = await action(row.kind, row.id);
    toast({ message: r.ok ? fill(done, { name: row.name }) : (r.message ?? "") });
    setConfirming(null);
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
            <Menu
              label={t.actions.more}
              items={[
                {
                  label: t.trash.restore,
                  icon: <RotateCcw size={16} aria-hidden="true" />,
                  onSelect: () => void run(restore, row, t.trash.restored),
                },
                {
                  label: t.trash.purge,
                  icon: <Trash2 size={16} aria-hidden="true" />,
                  tone: "danger",
                  onSelect: () => setConfirming(row.id),
                },
              ]}
            />
          }
        >
          {confirming === row.id && (
            <div role="alert" className="flex flex-col gap-2 pt-1 text-meta">
              <p>{fill(t.trash.confirm, { name: row.name })}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void run(purge, row, t.trash.purged)}
                  className="rule-medium rounded-control border-tomato px-3 py-1.5 font-display font-semibold text-tomato"
                >
                  {t.trash.confirmYes}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-control border border-hairline px-3 py-1.5 font-display font-semibold"
                >
                  {t.trash.cancel}
                </button>
              </div>
            </div>
          )}
        </ListItem>
      ))}
    </ul>
  );
}
