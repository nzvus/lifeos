/**
 * features/nutrition/log/UndoCheckin.tsx — undo the accepted weekly
 * check-in (ADR-0048): the week's days follow the goal again, computed
 * live. Client component (the button).
 */
"use client";

import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { toast } from "@/ui/Toast";

export function UndoCheckin({
  undo,
  t,
}: {
  undo: () => Promise<{ ok: boolean; message?: string }>;
  t: Messages["energy"]["weightGoal"];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await undo();
          toast({ message: r.ok ? t.undone : (r.message ?? "") });
          router.refresh();
        })
      }
      className={`${buttonClass({ variant: "quiet", size: "sm" })} self-start`}
    >
      <Undo2 size={16} aria-hidden="true" />
      {t.undo}
    </button>
  );
}
