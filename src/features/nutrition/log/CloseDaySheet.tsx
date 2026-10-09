/**
 * features/nutrition/log/CloseDaySheet.tsx — closing the day (ADR-0042),
 * in a sheet (#day-close) opened by Today's chip: "what I logged is what I
 * ate" or "something is missing". What you spend is learnt from it: a
 * complete day is trusted, a partial one is not read as a deficit.
 * Client component (the buttons).
 */
"use client";

import { ClipboardCheck, ClipboardX, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { toast } from "@/ui/Toast";

type State = "complete" | "partial";

export function CloseDaySheet({
  day,
  closure,
  action,
  t,
}: {
  day: string;
  closure: State | null;
  action: (
    day: string,
    state: State | null,
  ) => Promise<{ ok: boolean; message?: string }>;
  t: Pick<Messages, "dayChips" | "actions">;
}) {
  const c = t.dayChips.close;
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (state: State | null, done: string) =>
    start(async () => {
      const r = await action(day, state);
      toast({ message: r.ok ? done : (r.message ?? "") });
      router.refresh();
    });
  const option = (state: State, icon: React.ReactNode, label: string, hint: string) => (
    <button
      type="button"
      disabled={pending}
      aria-pressed={closure === state}
      onClick={() => set(state, label)}
      className={`${buttonClass({ variant: closure === state ? "primary" : "secondary" })} flex-col items-start text-left`}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-meta font-normal">{hint}</span>
    </button>
  );
  return (
    <Sheet
      id="day-close"
      title={c.title}
      icon={<ClipboardCheck size={20} aria-hidden="true" />}
      closeLabel={t.actions.close}
    >
      <p className="text-meta text-muted">{c.why}</p>
      <div className="flex flex-col gap-2">
        {option(
          "complete",
          <ClipboardCheck size={18} aria-hidden="true" />,
          c.complete,
          c.completeHint,
        )}
        {option(
          "partial",
          <ClipboardX size={18} aria-hidden="true" />,
          c.partial,
          c.partialHint,
        )}
      </div>
      {closure && (
        <button
          type="button"
          disabled={pending}
          onClick={() => set(null, c.reopened)}
          className={`self-start ${buttonClass({ variant: "quiet", size: "sm" })}`}
        >
          <RotateCcw size={16} aria-hidden="true" />
          {c.reopen}
        </button>
      )}
    </Sheet>
  );
}
